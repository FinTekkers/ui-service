// Services
import { PositionService } from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';

// Models
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';

// Requests
import { QueryPositionRequest } from '@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest';

// Types
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import measurePkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
const { MeasureProto } = measurePkg;
import type { MeasureProto as MeasureProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import positionPkg from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js';
const { PositionTypeProto, PositionViewProto } = positionPkg;
import type { PositionTypeProto as PositionTypeProtoType, PositionViewProto as PositionViewProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';

// Import FieldProto as both type and value
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import type { FieldProto as FieldProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { TenorProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/tenor_pb';
import { TenorTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/tenor_type_pb';
import { Tenor } from '@fintekkers/ledger-models/node/wrappers/models/security/term';

// Constants
const PORTFOLIO_NAME = "Federal Reserve SOMA Holdings";

/**
 * Maps FieldProto enum value to field name string
 */
function getFieldName(fieldEnum: number): string {
    // Create reverse lookup: enum value -> name
    const fieldNameMap: Record<number, string> = {};
    Object.keys(FieldProto).forEach((key: string) => {
        const value = (FieldProto as any)[key];
        if (typeof value === 'number') {
            fieldNameMap[value] = key;
        }
    });
    return fieldNameMap[fieldEnum] || fieldEnum.toString();
}

/**
 * Maps MeasureProto enum value to measure name string
 */
function getMeasureName(measureEnum: number): string {
    const measureNameMap: Record<number, string> = {};
    Object.keys(MeasureProto).forEach((key: string) => {
        const value = (MeasureProto as any)[key];
        if (typeof value === 'number') {
            measureNameMap[value] = key;
        }
    });
    return measureNameMap[measureEnum] || measureEnum.toString();
}

/**
 * Treasury transaction data structure
 */
export interface TreasuryTransaction {
    IDENTIFIER: string;
    TRANSACTION_TYPE: string;
    TRADE_DATE: Date;
    MATURITY_DATE?: Date | string;
    ISSUE_DATE?: Date | string;
    PRODUCT_TYPE?: string;
    ADJUSTED_TENOR?: string;
    DIRECTED_QUANTITY: number;
}

/**
 * Creates a PositionFilter for trade date filtering (TRADE_DATE <= asOfDate)
 * Equivalent to get_trade_date_filter in Python recon_utils.py
 */
export function createTradeDateFilter(asOfDate: Date): PositionFilter {
    const filter = new PositionFilter();
    filter.addFilter(
        FieldProto.TRADE_DATE,
        PositionFilterOperator.LESS_THAN_OR_EQUALS,
        asOfDate
    );
    return filter;
}

/**
 * Creates a PositionFilter for portfolio name filtering
 */
export function createPortfolioFilter(): PositionFilter {
    const filter = new PositionFilter();
    filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, PORTFOLIO_NAME);
    return filter;
}

/**
 * Converts a Position object to a plain JavaScript object with field/measure names as keys
 * Equivalent to create_dataframe_from_response in Python positions.py
 * Uses field/measure names (like IDENTIFIER, TRADE_DATE) as keys for easier access
 */
export function positionToPlainObject(position: Position): Record<string, any> {
    const result: Record<string, any> = {};

    function anyValueToU8(anyMsg: Any): Uint8Array | undefined {
        const u8 = (anyMsg as any).getValue_asU8?.();
        if (u8) return u8 as Uint8Array;

        const v = (anyMsg as any).getValue?.();
        if (!v) return undefined;

        // google-protobuf may represent bytes as base64 string
        if (typeof v === 'string') {
            try {
                return Uint8Array.from(Buffer.from(v, 'base64'));
            } catch {
                return undefined;
            }
        }
        return v as Uint8Array;
    }

    function extractAdjustedTenor(raw: any, display: any): string | undefined {
        // If display is already a meaningful tenor, keep it
        if (typeof display === 'string') {
            const d = display.trim();
            if (d && d.toLowerCase() !== 'tenor') return d;
        }

        if (raw == null) return undefined;
        if (typeof raw === 'string') return raw;

        // Common wrapper patterns
        if (typeof raw.getTenorDescription === 'function') return raw.getTenorDescription();
        if (typeof raw.getDescription === 'function') return raw.getDescription();
        if (typeof raw.name === 'function') return raw.name();

        // Fallback to toString if it's informative
        if (typeof raw.toString === 'function') {
            const s = String(raw.toString());
            if (s && s !== '[object Object]') return s;
        }

        // Some wrappers keep the proto under `.proto`
        if (raw.proto && typeof raw.proto.toString === 'function') {
            const s = String(raw.proto.toString());
            if (s && s !== '[object Object]') return s;
        }

        return undefined;
    }

    // Extract fields - use field name as key (matching Python pattern)
    for (const field of position.getFields()) {
        const fieldName = getFieldName(field.getField());
        const displayValue = position.getFieldDisplay(field);

        // ADJUSTED_TENOR comes back as the literal string "Tenor" via getFieldDisplay() in this environment.
        // Use the packed StringValue (and/or getFieldValue) to extract the actual tenor.
        if (fieldName === 'ADJUSTED_TENOR') {
            // Prefer reading the packed StringValue directly (ProtoSerializationUtil currently uses StringValue.toString()).
            let packedValue: string | undefined = undefined;
            try {
                const packedAny = field.getFieldValuePacked?.() as Any | undefined;
                if (packedAny) {
                    const typeUrl = (packedAny as any).getTypeUrl?.() as string | undefined;
                    const bytes = anyValueToU8(packedAny);
                    if (bytes) {
                        // If the Any says it's a StringValue, decode as StringValue
                        if (!typeUrl || typeUrl === 'type.googleapis.com/google.protobuf.StringValue') {
                            const sv = StringValue.deserializeBinary(bytes);
                            const v = sv.getValue();
                            if (v && v.trim().length > 0) packedValue = v;
                        }

                        // Some deployments may pack TenorProto here; decode and format it
                        if (!packedValue && typeUrl && typeUrl.toLowerCase().includes('tenor')) {
                            const tp = TenorProto.deserializeBinary(bytes);
                            const termValue = tp.getTermValue();
                            const tenorType = tp.getTenorType();
                            // Prefer wrapper formatting if possible
                            try {
                                const t = termValue && termValue.length > 0
                                    ? new Tenor(tenorType as TenorTypeProto, termValue)
                                    : new Tenor(tenorType as TenorTypeProto);
                                packedValue = t.toString();
                            } catch {
                                packedValue = termValue || undefined;
                            }
                        }

                        // As a last resort, try decoding as StringValue anyway (even if typeUrl is missing/mis-set)
                        if (!packedValue) {
                            const sv = StringValue.deserializeBinary(bytes);
                            const v = sv.getValue();
                            if (v && v.trim().length > 0) packedValue = v;
                        }
                    }
                }
            } catch {
                // ignore and fall back
            }

            const rawValue = (position as any).getFieldValue
                ? (position as any).getFieldValue(field.getField())
                : undefined;
            result[fieldName] =
                (packedValue && packedValue.trim() !== 'Tenor' ? packedValue : undefined) ??
                extractAdjustedTenor(rawValue, displayValue) ??
                displayValue;
        } else {
            result[fieldName] = displayValue;
        }
    }

    // Extract measures - use measure name as key
    for (const measure of position.getMeasures()) {
        const measureName = getMeasureName(measure.getMeasure());
        result[measureName] = position.getMeasureValue(measure.getMeasure());
    }

    return result;
}

/**
 * Processes transaction data: filters out USD identifiers, parses dates, and sorts by trade date
 * Equivalent to the data processing in get_transactions in Python data.py
 */
export function processTransactionData(
    positions: Position[]
): TreasuryTransaction[] {
    if (!positions || positions.length === 0) {
        return [];
    }

    // Convert positions to plain objects
    const plainObjects = positions.map(positionToPlainObject);

    // Filter out USD identifiers and convert to TreasuryTransaction format
    const transactions: TreasuryTransaction[] = plainObjects
        .filter((obj) => {
            const identifier = String(obj.IDENTIFIER || '');
            return !identifier.includes('USD');
        })
        .map((obj) => {
            // Extract values using field names (matching Python output format)
            const identifier = String(obj.IDENTIFIER || '');
            const transactionType = String(obj.TRANSACTION_TYPE || '');
            const tradeDateStr = obj.TRADE_DATE || '';
            const maturityDate = obj.MATURITY_DATE;
            const issueDate = obj.ISSUE_DATE;
            const productType = obj.PRODUCT_TYPE;
            const adjustedTenor = obj.ADJUSTED_TENOR;
            const directedQuantity = Number(obj.DIRECTED_QUANTITY || 0);

            // Parse trade date
            let tradeDate: Date;
            if (tradeDateStr instanceof Date) {
                tradeDate = tradeDateStr;
            } else if (typeof tradeDateStr === 'string') {
                // Parse date string, handling ISO format and other formats
                // Use Date constructor which handles ISO 8601 format
                const parsed = new Date(tradeDateStr);
                // Check if date is valid
                if (isNaN(parsed.getTime())) {
                    // Try alternative parsing if ISO format fails
                    tradeDate = new Date();
                } else {
                    tradeDate = parsed;
                }
            } else {
                // Try to get date from position object if available
                tradeDate = new Date();
            }

            // Parse optional dates
            let parsedMaturityDate: Date | string | undefined;
            if (maturityDate) {
                if (maturityDate instanceof Date) {
                    parsedMaturityDate = maturityDate;
                } else if (typeof maturityDate === 'string') {
                    parsedMaturityDate = new Date(maturityDate);
                } else {
                    parsedMaturityDate = maturityDate;
                }
            }

            let parsedIssueDate: Date | string | undefined;
            if (issueDate) {
                if (issueDate instanceof Date) {
                    parsedIssueDate = issueDate;
                } else if (typeof issueDate === 'string') {
                    parsedIssueDate = new Date(issueDate);
                } else {
                    parsedIssueDate = issueDate;
                }
            }

            return {
                IDENTIFIER: String(identifier),
                TRANSACTION_TYPE: String(transactionType),
                TRADE_DATE: tradeDate,
                MATURITY_DATE: parsedMaturityDate,
                ISSUE_DATE: parsedIssueDate,
                PRODUCT_TYPE: productType ? String(productType) : undefined,
                ADJUSTED_TENOR: adjustedTenor ? String(adjustedTenor) : undefined,
                DIRECTED_QUANTITY: Number(directedQuantity),
            };
        })
        .sort((a, b) => {
            // Sort by trade date (ascending)
            return a.TRADE_DATE.getTime() - b.TRADE_DATE.getTime();
        });

    return transactions;
}

/**
 * Fetches treasury transactions for a given as-of date
 * Equivalent to get_transactions in Python data.py
 * 
 * @param asOfDate - The as-of date for filtering transactions (defaults to now)
 * @returns Array of TreasuryTransaction objects, or null if no results found
 */
export async function getTreasuryTransactions(
    asOfDate: Date = new Date()
): Promise<TreasuryTransaction[] | null> {
    const positionService = new PositionService();
    const now = ZonedDateTime.now();

    // Create combined filter
    const combinedFilter = new PositionFilter();
    combinedFilter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, PORTFOLIO_NAME);
    combinedFilter.addFilter(
        FieldProto.TRADE_DATE,
        PositionFilterOperator.LESS_THAN_OR_EQUALS,
        asOfDate
    );

    // Define required fields and measures
    const fields: FieldProtoType[] = [
        FieldProto.IDENTIFIER,
        FieldProto.TRANSACTION_TYPE,
        FieldProto.TRADE_DATE,
        FieldProto.MATURITY_DATE,
        FieldProto.ISSUE_DATE,
        FieldProto.PRODUCT_TYPE,
        // Add TENOR for diagnostics / cross-checking when ADJUSTED_TENOR is mis-populated upstream
        FieldProto.TENOR,
        FieldProto.ADJUSTED_TENOR,
    ];

    const measures: MeasureProtoType[] = [MeasureProto.DIRECTED_QUANTITY];

    // Create request
    const request = new QueryPositionRequest(
        combinedFilter,
        PositionTypeProto.TRANSACTION,
        PositionViewProto.DEFAULT_VIEW,
        fields,
        measures,
        now
    );

    try {
        const results: Position[] = await positionService.search(request);

        if (!results || results.length === 0) {
            console.log("No results found");
            return null;
        }

        // Process and return transactions
        const transactions = processTransactionData(results);
        return transactions;
    } catch (error) {
        console.error("Error fetching treasury transactions:", error);

        // Try to get validation errors if available
        try {
            const summary = await positionService.validateRequest(request);
            summary.getErrorsList().forEach((err) => {
                console.error(err.getDetail()?.getMessageForDeveloper());
            });
        } catch (validationError) {
            // Ignore validation errors if they occur
        }

        throw error;
    }
}

