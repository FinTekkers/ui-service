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

// Import FieldProto as both type and value
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import type { FieldProto as FieldProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';
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
    TRADE_DATE: string;
    MATURITY_DATE: string;
    ISSUE_DATE: string;
    PRODUCT_TYPE?: string;
    ADJUSTED_TENOR?: string;
    DIRECTED_QUANTITY: number;
    TENOR?: {
        years: number;
        months: number;
    };
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

    // Extract fields - use field name as key (matching Python pattern)
    for (const field of position.getFields()) {
        const fieldName = getFieldName(field.getField());
        let displayValue: any;
        try {
            displayValue = position.getFieldDisplay(field);
        } catch (error) {
            // Handle cases where getFieldDisplay fails (e.g., malformed TENOR descriptions)
            console.warn(`Error getting field display for ${fieldName}:`, error);
            // Try to get raw value as fallback
            try {
                const rawValue = (position as any).getFieldValue?.(field.getField());
                displayValue = rawValue?.toString() || '';
            } catch {
                displayValue = '';
            }
        }

        result[fieldName] = displayValue;
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
    const transactions: TreasuryTransaction[] = positions
        .map((position, index) => {
            const obj = plainObjects[index];
            const identifier = String(obj.IDENTIFIER || '');

            // Filter out USD identifiers
            if (identifier.includes('USD')) {
                return null;
            }

            // Extract values using field names (matching Python output format)
            const transactionType = String(obj.TRANSACTION_TYPE || '');
            const tradeDateStr = obj.TRADE_DATE;
            const maturityDate = obj.MATURITY_DATE;
            const issueDate = obj.ISSUE_DATE;
            const productType = obj.PRODUCT_TYPE;
            const adjustedTenor = obj.ADJUSTED_TENOR;
            const directedQuantity = Number(obj.DIRECTED_QUANTITY || 0);

            // Extract Tenor object directly from Position using getFieldValue and convert to plain object
            let tenor: { years: number; months: number } | undefined;
            try {
                const tenorValue = position.getFieldValue(FieldProto.TENOR);
                // Check if it's a Tenor object (has getTenor method) or is already a Tenor
                if (tenorValue) {
                    let tenorObj: Tenor | null = null;
                    if (tenorValue instanceof Tenor) {
                        tenorObj = tenorValue;
                    } else if (typeof (tenorValue as any).getTenor === 'function') {
                        tenorObj = tenorValue as Tenor;
                    } else {
                        // Try to construct Tenor from the value if it's a proto message
                        try {
                            tenorObj = new Tenor(tenorValue as any);
                        } catch {
                            // If construction fails, tenorObj remains null
                        }
                    }

                    // Extract years and months from Tenor object
                    if (tenorObj) {
                        const tenorData = tenorObj.getTenor();
                        if (tenorData) {
                            tenor = {
                                years: tenorData.years ?? 0,
                                months: tenorData.months ?? 0
                            };
                        }
                    }
                }
            } catch (error) {
                // If TENOR field extraction fails, tenor remains undefined
                // This is expected if TENOR field is not available
            }

            return {
                IDENTIFIER: String(identifier),
                TRANSACTION_TYPE: String(transactionType),
                TRADE_DATE: tradeDateStr,
                MATURITY_DATE: maturityDate,
                ISSUE_DATE: issueDate,
                PRODUCT_TYPE: productType ? String(productType) : undefined,
                TENOR: tenor,
                DIRECTED_QUANTITY: Number(directedQuantity),
            };
        })
        .filter((txn): txn is TreasuryTransaction => txn !== null);

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
        FieldProto.ADJUSTED_TENOR,
        FieldProto.TENOR,
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

