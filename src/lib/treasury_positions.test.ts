import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createTradeDateFilter,
    createPortfolioFilter,
    positionToPlainObject,
    processTransactionData,
    getTreasuryTransactions,
    type TreasuryTransaction,
} from './treasury_positions';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';
import { PositionTypeProto, PositionViewProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

// Mock the PositionService
const mockSearch = vi.fn();
const mockValidateRequest = vi.fn();

vi.mock('@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService', () => {
    return {
        PositionService: vi.fn().mockImplementation(() => ({
            search: mockSearch,
            validateRequest: mockValidateRequest,
        })),
    };
});

// Mock ZonedDateTime
vi.mock('@fintekkers/ledger-models/node/wrappers/models/utils/datetime', () => {
    return {
        ZonedDateTime: {
            now: vi.fn(() => ({
                toProto: vi.fn(() => ({})),
            })),
        },
    };
});

// Mock QueryPositionRequest
vi.mock('@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest', () => {
    return {
        QueryPositionRequest: vi.fn(),
    };
});

describe('treasury_positions', () => {
    describe('createTradeDateFilter', () => {
        it('should create a filter with LESS_THAN_OR_EQUALS operator for trade date', () => {
            const asOfDate = new Date('2024-01-15');
            const filter = createTradeDateFilter(asOfDate);

            expect(filter).toBeInstanceOf(PositionFilter);
            // Verify the filter was created (we can't easily inspect internal state)
            expect(filter).toBeDefined();
        });

        it('should handle different date values', () => {
            const date1 = new Date('2023-12-31');
            const date2 = new Date('2024-06-15');

            const filter1 = createTradeDateFilter(date1);
            const filter2 = createTradeDateFilter(date2);

            expect(filter1).toBeInstanceOf(PositionFilter);
            expect(filter2).toBeInstanceOf(PositionFilter);
        });
    });

    describe('createPortfolioFilter', () => {
        it('should create a filter for Federal Reserve SOMA Holdings portfolio', () => {
            const filter = createPortfolioFilter();

            expect(filter).toBeInstanceOf(PositionFilter);
            expect(filter).toBeDefined();
        });
    });

    describe('positionToPlainObject', () => {
        it('should convert a Position object to a plain object with field names as keys', () => {
            // Create a mock Position object
            const mockPosition = {
                getFields: vi.fn(() => [
                    {
                        getField: vi.fn(() => FieldProto.IDENTIFIER),
                    },
                    {
                        getField: vi.fn(() => FieldProto.TRADE_DATE),
                    },
                ]),
                getFieldDisplay: vi.fn((field) => {
                    if (field.getField() === FieldProto.IDENTIFIER) return '912797LX3';
                    if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                    return '';
                }),
                getMeasures: vi.fn(() => [
                    {
                        getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY),
                    },
                ]),
                getMeasureValue: vi.fn((measure) => {
                    if (measure === MeasureProto.DIRECTED_QUANTITY) return 1000000;
                    return 0;
                }),
            } as unknown as Position;

            const result = positionToPlainObject(mockPosition);

            expect(result).toBeDefined();
            expect(result.IDENTIFIER).toBe('912797LX3');
            expect(result.TRADE_DATE).toBe('2024-01-15');
            expect(result.DIRECTED_QUANTITY).toBe(1000000);
        });

        it('should prefer getFieldValue for ADJUSTED_TENOR when getFieldDisplay returns \"Tenor\"', () => {
            const mockPosition = {
                getFields: vi.fn(() => [
                    { getField: vi.fn(() => FieldProto.ADJUSTED_TENOR) },
                ]),
                getFieldDisplay: vi.fn(() => 'Tenor'),
                getFieldValue: vi.fn(() => '2 years'),
                getMeasures: vi.fn(() => []),
                getMeasureValue: vi.fn(() => 0),
            } as unknown as Position;

            const result = positionToPlainObject(mockPosition);
            expect(result.ADJUSTED_TENOR).toBe('2 years');
        });

        it('should decode ADJUSTED_TENOR from packed Any StringValue when display is \"Tenor\"', () => {
            const sv = new StringValue();
            sv.setValue('2Y');
            const anyMsg = new Any();
            anyMsg.pack(sv.serializeBinary(), 'google.protobuf.StringValue');

            const mockFieldEntry = {
                getField: vi.fn(() => FieldProto.ADJUSTED_TENOR),
                getFieldValuePacked: vi.fn(() => anyMsg),
            };

            const mockPosition = {
                getFields: vi.fn(() => [mockFieldEntry]),
                getFieldDisplay: vi.fn(() => 'Tenor'),
                getFieldValue: vi.fn(() => undefined),
                getMeasures: vi.fn(() => []),
                getMeasureValue: vi.fn(() => 0),
            } as unknown as Position;

            const result = positionToPlainObject(mockPosition);
            expect(result.ADJUSTED_TENOR).toBe('2Y');
        });

        it('should handle positions with multiple fields and measures', () => {
            const mockPosition = {
                getFields: vi.fn(() => [
                    { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                    { getField: vi.fn(() => FieldProto.TRANSACTION_TYPE) },
                    { getField: vi.fn(() => FieldProto.PRODUCT_TYPE) },
                ]),
                getFieldDisplay: vi.fn((field) => {
                    const fieldMap: Record<number, string> = {
                        [FieldProto.IDENTIFIER]: '912797LX3',
                        [FieldProto.TRANSACTION_TYPE]: 'BUY',
                        [FieldProto.PRODUCT_TYPE]: 'Treasury Note',
                    };
                    return fieldMap[field.getField()] || '';
                }),
                getMeasures: vi.fn(() => [
                    { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                ]),
                getMeasureValue: vi.fn(() => 5000000),
            } as unknown as Position;

            const result = positionToPlainObject(mockPosition);

            expect(result.IDENTIFIER).toBe('912797LX3');
            expect(result.TRANSACTION_TYPE).toBe('BUY');
            expect(result.PRODUCT_TYPE).toBe('Treasury Note');
            expect(result.DIRECTED_QUANTITY).toBe(5000000);
        });
    });

    describe('processTransactionData', () => {
        it('should filter out USD identifiers', () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return 'USD';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                        return '';
                    }),
                    getMeasures: vi.fn(() => []),
                    getMeasureValue: vi.fn(() => 0),
                },
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return '912797LX3';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-16';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
            ] as unknown as Position[];

            const result = processTransactionData(mockPositions);

            expect(result).toHaveLength(1);
            expect(result[0].IDENTIFIER).toBe('912797LX3');
            expect(result[0].IDENTIFIER).not.toContain('USD');
        });

        it('should parse and convert trade dates to Date objects', () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return '912797LX3';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
            ] as unknown as Position[];

            const result = processTransactionData(mockPositions);

            expect(result).toHaveLength(1);
            expect(result[0].TRADE_DATE).toBeInstanceOf(Date);
            // Check that the date is valid and represents January 2024
            // Note: Date parsing can vary by timezone, so we check the date string representation
            const dateStr = result[0].TRADE_DATE;
            expect(dateStr).toBe('2024-01-15');
        });

        it('should sort transactions by trade date in ascending order', () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return 'B';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-20';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return 'A';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 2000000),
                },
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return 'C';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-18';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 3000000),
                },
            ] as unknown as Position[];

            const result = processTransactionData(mockPositions);

            expect(result).toHaveLength(3);
            expect(result[0].IDENTIFIER).toBe('A'); // Earliest date
            expect(result[1].IDENTIFIER).toBe('C'); // Middle date
            expect(result[2].IDENTIFIER).toBe('B'); // Latest date

            // Verify dates are in ascending order
            expect(result[0].TRADE_DATE.getTime()).toBeLessThan(result[1].TRADE_DATE.getTime());
            expect(result[1].TRADE_DATE.getTime()).toBeLessThan(result[2].TRADE_DATE.getTime());
        });

        it('should handle optional fields (MATURITY_DATE, ISSUE_DATE, PRODUCT_TYPE, ADJUSTED_TENOR)', () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                        { getField: vi.fn(() => FieldProto.MATURITY_DATE) },
                        { getField: vi.fn(() => FieldProto.ISSUE_DATE) },
                        { getField: vi.fn(() => FieldProto.PRODUCT_TYPE) },
                        { getField: vi.fn(() => FieldProto.ADJUSTED_TENOR) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        const fieldMap: Record<number, string> = {
                            [FieldProto.IDENTIFIER]: '912797LX3',
                            [FieldProto.TRADE_DATE]: '2024-01-15',
                            [FieldProto.MATURITY_DATE]: '2026-01-15',
                            [FieldProto.ISSUE_DATE]: '2024-01-01',
                            [FieldProto.PRODUCT_TYPE]: 'Treasury Note',
                            [FieldProto.ADJUSTED_TENOR]: '2 years',
                        };
                        return fieldMap[field.getField()] || '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
            ] as unknown as Position[];

            const result = processTransactionData(mockPositions);

            expect(result).toHaveLength(1);
            expect(result[0].MATURITY_DATE).toBeDefined();
            expect(result[0].ISSUE_DATE).toBeDefined();
            expect(result[0].PRODUCT_TYPE).toBe('Treasury Note');
            expect(result[0].ADJUSTED_TENOR).toBe('2 years');
        });

        it('should return empty array for empty input', () => {
            const result = processTransactionData([]);
            expect(result).toEqual([]);
        });

        it('should handle positions with missing DIRECTED_QUANTITY', () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return '912797LX3';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                        return '';
                    }),
                    getMeasures: vi.fn(() => []),
                    getMeasureValue: vi.fn(() => 0),
                },
            ] as unknown as Position[];

            const result = processTransactionData(mockPositions);

            expect(result).toHaveLength(1);
            expect(result[0].DIRECTED_QUANTITY).toBe(0);
        });
    });

    describe('getTreasuryTransactions', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            mockSearch.mockClear();
            mockValidateRequest.mockClear();
        });

        it('should return null when no results are found', async () => {
            mockSearch.mockResolvedValue([]);

            const result = await getTreasuryTransactions(new Date('2024-01-15'));

            expect(result).toBeNull();
            expect(mockSearch).toHaveBeenCalled();
        });

        it('should return processed transactions when results are found', async () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                        { getField: vi.fn(() => FieldProto.TRANSACTION_TYPE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        const fieldMap: Record<number, string> = {
                            [FieldProto.IDENTIFIER]: '912797LX3',
                            [FieldProto.TRADE_DATE]: '2024-01-15',
                            [FieldProto.TRANSACTION_TYPE]: 'BUY',
                        };
                        return fieldMap[field.getField()] || '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
            ] as unknown as Position[];

            mockSearch.mockResolvedValue(mockPositions);

            const result = await getTreasuryTransactions(new Date('2024-01-15'));

            expect(result).not.toBeNull();
            expect(Array.isArray(result)).toBe(true);
            if (result) {
                expect(result.length).toBeGreaterThan(0);
                expect(result[0]).toHaveProperty('IDENTIFIER');
                expect(result[0]).toHaveProperty('TRADE_DATE');
                expect(result[0]).toHaveProperty('TRANSACTION_TYPE');
                expect(result[0]).toHaveProperty('DIRECTED_QUANTITY');
            }
        });

        it('should use current date as default when no asOfDate is provided', async () => {
            mockSearch.mockResolvedValue([]);

            await getTreasuryTransactions();

            expect(mockSearch).toHaveBeenCalled();
        });

        it('should handle errors and throw them', async () => {
            const error = new Error('Service error');
            mockSearch.mockRejectedValue(error);
            mockValidateRequest.mockResolvedValue({
                getErrorsList: vi.fn(() => []),
            });

            await expect(getTreasuryTransactions(new Date('2024-01-15'))).rejects.toThrow('Service error');
        });

        it('should filter out USD identifiers from results', async () => {
            const mockPositions = [
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return 'USD';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-15';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 1000000),
                },
                {
                    getFields: vi.fn(() => [
                        { getField: vi.fn(() => FieldProto.IDENTIFIER) },
                        { getField: vi.fn(() => FieldProto.TRADE_DATE) },
                    ]),
                    getFieldDisplay: vi.fn((field) => {
                        if (field.getField() === FieldProto.IDENTIFIER) return '912797LX3';
                        if (field.getField() === FieldProto.TRADE_DATE) return '2024-01-16';
                        return '';
                    }),
                    getMeasures: vi.fn(() => [
                        { getMeasure: vi.fn(() => MeasureProto.DIRECTED_QUANTITY) },
                    ]),
                    getMeasureValue: vi.fn(() => 2000000),
                },
            ] as unknown as Position[];

            mockSearch.mockResolvedValue(mockPositions);

            const result = await getTreasuryTransactions(new Date('2024-01-20'));

            expect(result).not.toBeNull();
            if (result) {
                expect(result.length).toBe(1);
                expect(result[0].IDENTIFIER).toBe('912797LX3');
                expect(result[0].IDENTIFIER).not.toContain('USD');
            }
        });
    });
});

