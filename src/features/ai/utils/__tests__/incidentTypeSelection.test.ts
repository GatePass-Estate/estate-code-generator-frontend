import { describe, expect, it } from '@jest/globals';
import { toggleIncidentType } from '@/src/features/ai/utils/incidentTypeSelection';

describe('incident type selection', () => {
  it('keeps named incident types multi-select', () => {
    expect(toggleIncidentType(['Violence'], 'Vandalism')).toEqual(['Violence', 'Vandalism']);
  });

  it('clears named types when Other is selected', () => {
    expect(toggleIncidentType(['Violence', 'Vandalism'], 'Other')).toEqual(['Other']);
  });

  it('clears Other when a named type is selected', () => {
    expect(toggleIncidentType(['Other'], 'Violence')).toEqual(['Violence']);
  });

  it('allows selected types to be deselected', () => {
    expect(toggleIncidentType(['Other'], 'Other')).toEqual([]);
    expect(toggleIncidentType(['Violence', 'Vandalism'], 'Violence')).toEqual(['Vandalism']);
  });

  it('supports the lowercase other slug returned by the categories endpoint', () => {
    expect(toggleIncidentType(['security', 'theft'], 'other')).toEqual(['other']);
    expect(toggleIncidentType(['other'], 'security')).toEqual(['security']);
  });
});
