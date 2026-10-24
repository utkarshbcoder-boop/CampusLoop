import type { BookCondition, DeviceCategory, Listing } from "@/lib/types";

type DeviceSeed = {
  title: string;
  brand: string;
  specs: string;
  price: number;
  mrp: number;
  condition: BookCondition;
  tags: string[];
};

const mobilePhones: DeviceSeed[] = [
  { title: "Google Pixel 7a", brand: "Google", specs: "128 GB · 8 GB RAM", price: 18500, mrp: 43999, condition: "good", tags: ["5G", "OLED display"] },
  { title: "Google Pixel 8a", brand: "Google", specs: "128 GB · 8 GB RAM", price: 29500, mrp: 52999, condition: "like_new", tags: ["5G", "AI features"] },
  { title: "Samsung Galaxy S21 FE", brand: "Samsung", specs: "128 GB · 8 GB RAM", price: 21000, mrp: 49999, condition: "good", tags: ["5G", "AMOLED"] },
  { title: "Samsung Galaxy S23 FE", brand: "Samsung", specs: "128 GB · 8 GB RAM", price: 28500, mrp: 59999, condition: "like_new", tags: ["5G", "AMOLED"] },
  { title: "Samsung Galaxy A34 5G", brand: "Samsung", specs: "128 GB · 8 GB RAM", price: 14500, mrp: 30999, condition: "good", tags: ["5G", "Expandable storage"] },
  { title: "Samsung Galaxy A54 5G", brand: "Samsung", specs: "256 GB · 8 GB RAM", price: 19500, mrp: 40999, condition: "good", tags: ["5G", "OIS camera"] },
  { title: "OnePlus 10R", brand: "OnePlus", specs: "128 GB · 8 GB RAM", price: 17500, mrp: 38999, condition: "good", tags: ["5G", "80 W charging"] },
  { title: "OnePlus 11R", brand: "OnePlus", specs: "256 GB · 16 GB RAM", price: 26500, mrp: 44999, condition: "like_new", tags: ["5G", "AMOLED"] },
  { title: "OnePlus Nord 3", brand: "OnePlus", specs: "128 GB · 8 GB RAM", price: 18500, mrp: 33999, condition: "good", tags: ["5G", "80 W charging"] },
  { title: "OnePlus Nord CE 3", brand: "OnePlus", specs: "128 GB · 8 GB RAM", price: 13500, mrp: 26999, condition: "good", tags: ["5G", "AMOLED"] },
  { title: "Nothing Phone (2a)", brand: "Nothing", specs: "128 GB · 8 GB RAM", price: 19500, mrp: 25999, condition: "like_new", tags: ["5G", "Glyph Interface"] },
  { title: "Motorola Edge 40", brand: "Motorola", specs: "256 GB · 8 GB RAM", price: 16500, mrp: 29999, condition: "good", tags: ["5G", "Curved pOLED"] },
  { title: "Redmi Note 13 Pro", brand: "Xiaomi", specs: "256 GB · 8 GB RAM", price: 17500, mrp: 28999, condition: "good", tags: ["5G", "200 MP camera"] },
  { title: "Redmi Note 12 Pro+", brand: "Xiaomi", specs: "256 GB · 8 GB RAM", price: 15500, mrp: 29999, condition: "good", tags: ["5G", "120 W charging"] },
  { title: "Realme 12 Pro", brand: "realme", specs: "128 GB · 8 GB RAM", price: 16500, mrp: 25999, condition: "good", tags: ["5G", "Telephoto camera"] },
  { title: "iPhone 12", brand: "Apple", specs: "128 GB", price: 22500, mrp: 54900, condition: "good", tags: ["iOS", "Face ID"] },
  { title: "iPhone 14", brand: "Apple", specs: "128 GB", price: 38500, mrp: 69900, condition: "like_new", tags: ["iOS", "Face ID"] },
  { title: "iPhone 15", brand: "Apple", specs: "128 GB", price: 49500, mrp: 79900, condition: "like_new", tags: ["USB-C", "Dynamic Island"] },
];

const laptops: DeviceSeed[] = [
  { title: "HP Pavilion 14", brand: "HP", specs: "Intel Core i5 · 16 GB RAM", price: 38000, mrp: 69990, condition: "good", tags: ["512 GB SSD", "14-inch display"] },
  { title: "HP Pavilion x360 14", brand: "HP", specs: "Intel Core i5 · 8 GB RAM", price: 36000, mrp: 72990, condition: "good", tags: ["2-in-1 touchscreen", "512 GB SSD"] },
  { title: "HP Victus 15", brand: "HP", specs: "Ryzen 5 · 16 GB RAM", price: 52000, mrp: 84990, condition: "good", tags: ["RTX graphics", "512 GB SSD"] },
  { title: "Lenovo IdeaPad Slim 5", brand: "Lenovo", specs: "Ryzen 7 · 16 GB RAM", price: 49000, mrp: 79990, condition: "like_new", tags: ["1 TB SSD", "Backlit keyboard"] },
  { title: "Lenovo ThinkPad E14", brand: "Lenovo", specs: "Intel Core i5 · 16 GB RAM", price: 43000, mrp: 82990, condition: "good", tags: ["512 GB SSD", "Fingerprint reader"] },
  { title: "Lenovo LOQ 15", brand: "Lenovo", specs: "Intel Core i5 · 16 GB RAM", price: 62000, mrp: 99990, condition: "good", tags: ["RTX graphics", "144 Hz display"] },
  { title: "ASUS VivoBook 15", brand: "ASUS", specs: "Intel Core i5 · 16 GB RAM", price: 39000, mrp: 67990, condition: "good", tags: ["512 GB SSD", "15.6-inch display"] },
  { title: "ASUS Zenbook 14 OLED", brand: "ASUS", specs: "Intel Core i5 · 16 GB RAM", price: 59000, mrp: 99990, condition: "like_new", tags: ["OLED display", "512 GB SSD"] },
  { title: "ASUS TUF Gaming F15", brand: "ASUS", specs: "Intel Core i7 · 16 GB RAM", price: 68000, mrp: 114990, condition: "good", tags: ["RTX graphics", "1 TB SSD"] },
  { title: "Acer Aspire 5", brand: "Acer", specs: "Intel Core i5 · 16 GB RAM", price: 35000, mrp: 64990, condition: "good", tags: ["512 GB SSD", "Backlit keyboard"] },
  { title: "Acer Swift Go 14", brand: "Acer", specs: "Intel Core Ultra 5 · 16 GB RAM", price: 57000, mrp: 89990, condition: "like_new", tags: ["OLED display", "512 GB SSD"] },
  { title: "Acer Nitro V 15", brand: "Acer", specs: "Intel Core i5 · 16 GB RAM", price: 61000, mrp: 94990, condition: "good", tags: ["RTX graphics", "144 Hz display"] },
  { title: "Dell Vostro 14", brand: "Dell", specs: "Intel Core i5 · 16 GB RAM", price: 40000, mrp: 72990, condition: "good", tags: ["512 GB SSD", "14-inch display"] },
  { title: "Dell XPS 13", brand: "Dell", specs: "Intel Core i7 · 16 GB RAM", price: 72000, mrp: 139990, condition: "like_new", tags: ["1 TB SSD", "Premium display"] },
  { title: "MSI Thin 15", brand: "MSI", specs: "Intel Core i7 · 16 GB RAM", price: 64000, mrp: 104990, condition: "good", tags: ["RTX graphics", "512 GB SSD"] },
  { title: "Microsoft Surface Laptop Go 3", brand: "Microsoft", specs: "Intel Core i5 · 16 GB RAM", price: 51000, mrp: 89999, condition: "good", tags: ["Touchscreen", "256 GB SSD"] },
  { title: "Apple MacBook Air M2", brand: "Apple", specs: "8 GB RAM · 256 GB SSD", price: 65000, mrp: 99900, condition: "good", tags: ["Apple silicon", "13-inch display"] },
  { title: "Apple MacBook Pro 13 M2", brand: "Apple", specs: "8 GB RAM · 512 GB SSD", price: 79000, mrp: 129900, condition: "like_new", tags: ["Apple silicon", "Retina display"] },
];

const tablets: DeviceSeed[] = [
  { title: "Apple iPad 10th Generation", brand: "Apple", specs: "64 GB · Wi-Fi", price: 25000, mrp: 34900, condition: "good", tags: ["10.9-inch display", "USB-C"] },
  { title: "Apple iPad Air 5th Generation", brand: "Apple", specs: "64 GB · Wi-Fi", price: 39000, mrp: 59900, condition: "like_new", tags: ["M1 chip", "Apple Pencil support"] },
  { title: "Apple iPad mini 6th Generation", brand: "Apple", specs: "64 GB · Wi-Fi", price: 33000, mrp: 49900, condition: "good", tags: ["Compact display", "Apple Pencil support"] },
  { title: "Apple iPad Pro 11-inch", brand: "Apple", specs: "128 GB · Wi-Fi", price: 62000, mrp: 81900, condition: "good", tags: ["ProMotion display", "Face ID"] },
  { title: "Samsung Galaxy Tab S6 Lite", brand: "Samsung", specs: "128 GB · Wi-Fi", price: 18500, mrp: 30999, condition: "good", tags: ["S Pen included", "10.4-inch display"] },
  { title: "Samsung Galaxy Tab S8", brand: "Samsung", specs: "128 GB · Wi-Fi", price: 35500, mrp: 58999, condition: "like_new", tags: ["S Pen included", "120 Hz display"] },
  { title: "Samsung Galaxy Tab S8+", brand: "Samsung", specs: "128 GB · Wi-Fi", price: 44500, mrp: 74999, condition: "good", tags: ["S Pen included", "AMOLED display"] },
  { title: "Samsung Galaxy Tab S9 FE", brand: "Samsung", specs: "128 GB · Wi-Fi", price: 28500, mrp: 36999, condition: "good", tags: ["S Pen included", "Water resistant"] },
  { title: "OnePlus Pad", brand: "OnePlus", specs: "128 GB · Wi-Fi", price: 32500, mrp: 37999, condition: "like_new", tags: ["144 Hz display", "Dolby Atmos"] },
  { title: "OnePlus Pad Go", brand: "OnePlus", specs: "128 GB · Wi-Fi", price: 16500, mrp: 23999, condition: "good", tags: ["2.4K display", "Quad speakers"] },
  { title: "Lenovo Tab P11 (2nd Gen)", brand: "Lenovo", specs: "128 GB · Wi-Fi", price: 17500, mrp: 27999, condition: "good", tags: ["11.5-inch display", "Quad speakers"] },
  { title: "Lenovo Tab P12", brand: "Lenovo", specs: "128 GB · Wi-Fi", price: 23500, mrp: 34999, condition: "like_new", tags: ["12.7-inch display", "Pen support"] },
  { title: "Xiaomi Pad 6", brand: "Xiaomi", specs: "128 GB · Wi-Fi", price: 24500, mrp: 26999, condition: "good", tags: ["144 Hz display", "Snapdragon processor"] },
  { title: "Xiaomi Pad 5", brand: "Xiaomi", specs: "128 GB · Wi-Fi", price: 18500, mrp: 26999, condition: "good", tags: ["120 Hz display", "Quad speakers"] },
  { title: "Realme Pad 2", brand: "realme", specs: "128 GB · Wi-Fi", price: 14500, mrp: 19999, condition: "good", tags: ["11.5-inch display", "Quad speakers"] },
  { title: "Huawei MatePad 11", brand: "Huawei", specs: "128 GB · Wi-Fi", price: 24500, mrp: 39999, condition: "good", tags: ["120 Hz display", "Stylus support"] },
  { title: "Amazon Fire Max 11", brand: "Amazon", specs: "64 GB · Wi-Fi", price: 10500, mrp: 17999, condition: "like_new", tags: ["11-inch display", "Expandable storage"] },
  { title: "Nokia T21", brand: "Nokia", specs: "128 GB · Wi-Fi", price: 12500, mrp: 18999, condition: "good", tags: ["10.4-inch display", "Expandable storage"] },
];

const sellers = [
  "prof_02", "prof_04", "prof_07", "prof_09", "prof_11", "prof_12",
  "prof_14", "prof_15", "prof_16", "prof_18", "prof_19", "prof_20",
  "prof_21", "prof_22", "prof_23", "prof_24", "prof_25", "prof_26",
];
const colleges = [
  "col_iitb", "col_iitd", "col_bits", "col_nitt", "col_srm", "col_anna",
  "col_dtu", "col_ajupi",
];

function makeListings(
  products: DeviceSeed[],
  category: DeviceCategory,
  firstNumber: number,
): Listing[] {
  return products.map((product, index) => {
    const number = firstNumber + index;
    const day = 24 - (number % 24);
    return {
      id: `lst_device_${String(number).padStart(2, "0")}`,
      item_type: "device",
      device_type: category,
      is_sample: true,
      title: product.title,
      author: product.brand,
      edition: product.specs,
      subject: category === "mobile" ? "Mobile phones" : category === "laptop" ? "Laptops" : "Tablets",
      semester: "All years",
      branch: "All branches",
      kind: "sell",
      condition: product.condition,
      price: product.price,
      mrp: product.mrp,
      negotiable: true,
      seller_id: sellers[index],
      college_id: colleges[number % colleges.length],
      pickup_location: "Campus pickup",
      status: "available",
      description: `Sample ${category} listing for ${product.title}. Contact the seller to confirm condition, included accessories, and a convenient campus handover.`,
      highlights: [product.specs, ...product.tags.slice(0, 1)],
      tags: product.tags,
      hue: (number * 47) % 360,
      emoji: category === "mobile" ? "📱" : category === "laptop" ? "💻" : "📲",
      created_at: `2026-10-${String(day).padStart(2, "0")}T${String((number * 3) % 24).padStart(2, "0")}:00:00Z`,
      views: 20 + number * 3,
      saves: 2 + (number % 17),
      boosted: number % 9 === 0,
    };
  });
}

export const deviceListings: Listing[] = [
  ...makeListings(mobilePhones, "mobile", 7),
  ...makeListings(laptops, "laptop", 25),
  ...makeListings(tablets, "tablet", 43),
];
