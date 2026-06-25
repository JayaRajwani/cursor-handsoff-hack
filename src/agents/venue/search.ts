import type { VenueRecord, VenueSearchOptions } from "./types.js";
import { MOCK_LONDON_VENUES } from "./mockVenues.js";

/** Future integration: Google Maps API, venue marketplace APIs, scraping tools */
export interface VenueSearchProvider {
  search(options: VenueSearchOptions): Promise<VenueRecord[]>;
}

export class MockVenueSearchProvider implements VenueSearchProvider {
  async search(options: VenueSearchOptions): Promise<VenueRecord[]> {
    const cityLower = options.city.toLowerCase();

    return MOCK_LONDON_VENUES.filter((venue) => {
      const cityMatch = venue.city.toLowerCase() === cityLower;
      const capacityMatch = venue.capacity >= options.minCapacity * 0.7;
      const budgetMatch = venue.estimatedCost <= options.maxBudget * 1.5;
      return cityMatch && capacityMatch && budgetMatch;
    });
  }
}

export async function searchVenues(
  options: VenueSearchOptions,
  provider?: VenueSearchProvider,
): Promise<VenueRecord[]> {
  const searchProvider = provider ?? new MockVenueSearchProvider();
  return searchProvider.search(options);
}
