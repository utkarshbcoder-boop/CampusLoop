export type HomeType = "pg" | "separate_room" | "1rk" | "1bhk" | "2bhk" | "3bhk" | "4bhk";
export type HomeMode = "rent" | "sale";

export interface Home {
  id: string;
  title: string;
  locality: string;
  type: HomeType;
  mode: HomeMode;
  /** Monthly rent for rentals, listed price for sale. */
  price: number;
  beds: number;
  baths: number;
  furnished: "Full" | "Semi" | "Unfurnished";
  distanceKm: number;
  available: string;
  owner: string;
  /** Shop sellers only: business name shown to buyers (see firestore.rules). */
  shop_name?: string;
  /** Shop sellers only: physical shop address shown to buyers. */
  shop_address?: string;
}

export const HOME_TYPE_LABELS: Record<HomeType, string> = {
  pg: "PG",
  separate_room: "Separate room",
  "1rk": "1 RK",
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};

export const HOMES: Home[] = [
  { id: "h1", title: "Single AC room in students' PG with mess", locality: "Koramangala Block C", type: "pg", mode: "rent", price: 9500, beds: 1, baths: 1, furnished: "Full", distanceKm: 1.2, available: "Oct 15", owner: "StayRight PG" },
  { id: "h2", title: "Quiet single room in family flat", locality: "Indiranagar 100ft Road", type: "separate_room", mode: "rent", price: 12000, beds: 1, baths: 1, furnished: "Semi", distanceKm: 2.4, available: "Immediate", owner: "Mrs. Iyer" },
  { id: "h3", title: "Compact 1 RK near metro, ideal for one", locality: "HSR Layout Sector 2", type: "1rk", mode: "rent", price: 14000, beds: 1, baths: 1, furnished: "Full", distanceKm: 3.1, available: "Oct 20", owner: "NestRealty" },
  { id: "h4", title: "Furnished 1 BHK, gated society", locality: "BTM Layout 2nd Stage", type: "1bhk", mode: "rent", price: 19500, beds: 1, baths: 1, furnished: "Full", distanceKm: 1.8, available: "Nov 1", owner: "UrbanNest" },
  { id: "h5", title: "Spacious 2 BHK for flatmates, parking", locality: "JP Nagar Phase 6", type: "2bhk", mode: "rent", price: 28000, beds: 2, baths: 2, furnished: "Semi", distanceKm: 4.2, available: "Oct 25", owner: "R. Kulkarni" },
  { id: "h6", title: "3 BHK semi-furnished, near campus road", locality: "Jayanagar 4th Block", type: "3bhk", mode: "rent", price: 36000, beds: 3, baths: 2, furnished: "Semi", distanceKm: 2.0, available: "Immediate", owner: "HomeFinders" },
  { id: "h7", title: "Large 4 BHK villa for joint family", locality: "Whitefield Main Road", type: "4bhk", mode: "rent", price: 55000, beds: 4, baths: 4, furnished: "Full", distanceKm: 6.5, available: "Dec 1", owner: "Prestige Estates" },
  { id: "h8", title: "Sunny 2 BHK for sale, park facing", locality: "Basavanagudi", type: "2bhk", mode: "sale", price: 6800000, beds: 2, baths: 2, furnished: "Semi", distanceKm: 2.8, available: "Ready to move", owner: "KeyHomes" },
  { id: "h9", title: "New 3 BHK apartment, 2nd floor", locality: "Electronic City Phase 1", type: "3bhk", mode: "sale", price: 9200000, beds: 3, baths: 3, furnished: "Unfurnished", distanceKm: 8.0, available: "Ready to move", owner: "BuildSpace" },
  { id: "h10", title: "Premium 4 BHK penthouse with terrace", locality: "Indiranagar", type: "4bhk", mode: "sale", price: 28500000, beds: 4, baths: 5, furnished: "Full", distanceKm: 1.5, available: "Nov 15", owner: "Skyline Properties" },
  { id: "h11", title: "1 BHK independent studio flat", locality: "Marathahalli", type: "1bhk", mode: "sale", price: 4500000, beds: 1, baths: 1, furnished: "Semi", distanceKm: 5.2, available: "Ready to move", owner: "G. Reddy" },
  { id: "h12", title: "Budget PG for boys with laundry", locality: "KR Puram", type: "pg", mode: "rent", price: 7500, beds: 1, baths: 1, furnished: "Full", distanceKm: 1.0, available: "Immediate", owner: "CampusStay PG" },
];
