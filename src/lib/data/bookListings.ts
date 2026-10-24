import type { BookCondition, Listing } from "@/lib/types";

type BookSeed = {
  title: string;
  author: string;
  subject: string;
  edition: string;
  price: number;
  mrp: number;
  condition: BookCondition;
  tags: string[];
};

const books: BookSeed[] = [
  { title: "Data Structures and Algorithms in Java", author: "Robert Lafore", subject: "Computer Science", edition: "2nd Edition", price: 650, mrp: 1299, condition: "good", tags: ["programming", "DSA"] },
  { title: "Clean Code", author: "Robert C. Martin", subject: "Computer Science", edition: "1st Edition", price: 720, mrp: 1599, condition: "like_new", tags: ["software engineering", "programming"] },
  { title: "Computer Networking: A Top-Down Approach", author: "James Kurose & Keith Ross", subject: "Computer Science", edition: "8th Edition", price: 900, mrp: 1899, condition: "good", tags: ["networks", "textbook"] },
  { title: "Database System Concepts", author: "Abraham Silberschatz et al.", subject: "Computer Science", edition: "7th Edition", price: 850, mrp: 1799, condition: "good", tags: ["DBMS", "textbook"] },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", subject: "Computer Science", edition: "4th Edition", price: 1250, mrp: 2499, condition: "like_new", tags: ["AI", "machine learning"] },
  { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", subject: "Computer Science", edition: "20th Anniversary Edition", price: 800, mrp: 1699, condition: "good", tags: ["software", "career"] },
  { title: "Computer Organization and Design", author: "David A. Patterson & John L. Hennessy", subject: "Computer Science", edition: "5th Edition", price: 950, mrp: 1999, condition: "fair", tags: ["architecture", "hardware"] },
  { title: "Head First Java", author: "Kathy Sierra & Bert Bates", subject: "Computer Science", edition: "3rd Edition", price: 700, mrp: 1499, condition: "good", tags: ["Java", "programming"] },
  { title: "Digital Design", author: "M. Morris Mano & Michael Ciletti", subject: "Electronics & Communication", edition: "6th Edition", price: 800, mrp: 1650, condition: "good", tags: ["digital logic", "circuits"] },
  { title: "Microelectronic Circuits", author: "Adel S. Sedra & Kenneth C. Smith", subject: "Electronics & Communication", edition: "7th Edition", price: 1150, mrp: 2399, condition: "fair", tags: ["electronics", "analog"] },
  { title: "Communication Systems", author: "Simon Haykin", subject: "Electronics & Communication", edition: "5th Edition", price: 850, mrp: 1799, condition: "good", tags: ["signals", "communication"] },
  { title: "Electronic Devices and Circuit Theory", author: "Robert L. Boylestad", subject: "Electronics & Communication", edition: "11th Edition", price: 950, mrp: 1999, condition: "good", tags: ["electronics", "circuits"] },
  { title: "Modern Control Engineering", author: "Katsuhiko Ogata", subject: "Electrical Engineering", edition: "5th Edition", price: 900, mrp: 1899, condition: "good", tags: ["control systems", "engineering"] },
  { title: "Electrical Machinery", author: "P. S. Bimbhra", subject: "Electrical Engineering", edition: "7th Edition", price: 750, mrp: 1499, condition: "fair", tags: ["machines", "power"] },
  { title: "Power System Analysis", author: "John J. Grainger & William D. Stevenson", subject: "Electrical Engineering", edition: "1st Edition", price: 850, mrp: 1750, condition: "good", tags: ["power systems", "analysis"] },
  { title: "Fundamentals of Electric Circuits", author: "Charles K. Alexander & Matthew N. O. Sadiku", subject: "Electrical Engineering", edition: "6th Edition", price: 800, mrp: 1650, condition: "good", tags: ["circuits", "electrical"] },
  { title: "Engineering Mechanics: Statics", author: "J. L. Meriam & L. G. Kraige", subject: "Mechanical Engineering", edition: "8th Edition", price: 700, mrp: 1499, condition: "good", tags: ["mechanics", "statics"] },
  { title: "Thermodynamics: An Engineering Approach", author: "Yunus A. Cengel", subject: "Mechanical Engineering", edition: "9th Edition", price: 950, mrp: 1999, condition: "like_new", tags: ["thermodynamics", "engineering"] },
  { title: "Shigley's Mechanical Engineering Design", author: "Richard G. Budynas & J. Keith Nisbett", subject: "Mechanical Engineering", edition: "11th Edition", price: 1100, mrp: 2299, condition: "good", tags: ["machine design", "mechanical"] },
  { title: "Manufacturing Engineering and Technology", author: "Serope Kalpakjian & Steven Schmid", subject: "Mechanical Engineering", edition: "7th Edition", price: 900, mrp: 1899, condition: "fair", tags: ["manufacturing", "production"] },
  { title: "Principles of Marketing", author: "Philip Kotler & Gary Armstrong", subject: "Business Administration", edition: "18th Edition", price: 950, mrp: 1999, condition: "good", tags: ["marketing", "management"] },
  { title: "Organizational Behavior", author: "Stephen P. Robbins & Timothy A. Judge", subject: "Business Administration", edition: "18th Edition", price: 850, mrp: 1799, condition: "good", tags: ["management", "leadership"] },
  { title: "Operations Management", author: "William J. Stevenson", subject: "Business Administration", edition: "14th Edition", price: 1000, mrp: 2099, condition: "like_new", tags: ["operations", "supply chain"] },
  { title: "The Lean Startup", author: "Eric Ries", subject: "Business Administration", edition: "1st Edition", price: 450, mrp: 999, condition: "good", tags: ["entrepreneurship", "startups"] },
  { title: "Financial Accounting", author: "Jerry J. Weygandt et al.", subject: "Business Administration", edition: "4th Edition", price: 700, mrp: 1499, condition: "fair", tags: ["accounting", "finance"] },
  { title: "The Intelligent Investor", author: "Benjamin Graham", subject: "Economics", edition: "Revised Edition", price: 550, mrp: 1199, condition: "good", tags: ["investing", "finance"] },
  { title: "Principles of Economics", author: "N. Gregory Mankiw", subject: "Economics", edition: "9th Edition", price: 900, mrp: 1899, condition: "like_new", tags: ["microeconomics", "macroeconomics"] },
  { title: "Indian Economy", author: "Ramesh Singh", subject: "Economics", edition: "15th Edition", price: 600, mrp: 1299, condition: "good", tags: ["India", "competitive exams"] },
  { title: "A Random Walk Down Wall Street", author: "Burton G. Malkiel", subject: "Economics", edition: "12th Edition", price: 650, mrp: 1399, condition: "good", tags: ["markets", "investing"] },
  { title: "Introduction to Probability", author: "Dimitri P. Bertsekas & John N. Tsitsiklis", subject: "Mathematics", edition: "2nd Edition", price: 800, mrp: 1699, condition: "good", tags: ["probability", "statistics"] },
  { title: "Linear Algebra and Its Applications", author: "David C. Lay", subject: "Mathematics", edition: "5th Edition", price: 750, mrp: 1599, condition: "fair", tags: ["linear algebra", "matrices"] },
  { title: "Calculus: Early Transcendentals", author: "James Stewart", subject: "Mathematics", edition: "8th Edition", price: 1000, mrp: 2099, condition: "good", tags: ["calculus", "engineering"] },
  { title: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen", subject: "Mathematics", edition: "8th Edition", price: 850, mrp: 1799, condition: "like_new", tags: ["discrete math", "logic"] },
  { title: "Introduction to Electrodynamics", author: "David J. Griffiths", subject: "Physics", edition: "4th Edition", price: 800, mrp: 1699, condition: "good", tags: ["electromagnetism", "physics"] },
  { title: "Fundamentals of Physics", author: "David Halliday, Robert Resnick & Jearl Walker", subject: "Physics", edition: "11th Edition", price: 950, mrp: 1999, condition: "good", tags: ["mechanics", "electricity"] },
  { title: "Introduction to Quantum Mechanics", author: "David J. Griffiths & Darrell F. Schroeter", subject: "Physics", edition: "3rd Edition", price: 1000, mrp: 2099, condition: "like_new", tags: ["quantum", "modern physics"] },
  { title: "University Physics", author: "Hugh D. Young & Roger A. Freedman", subject: "Physics", edition: "15th Edition", price: 1100, mrp: 2299, condition: "fair", tags: ["physics", "problem solving"] },
  { title: "Organic Chemistry", author: "Paula Yurkanis Bruice", subject: "Chemistry", edition: "8th Edition", price: 1000, mrp: 2099, condition: "good", tags: ["organic", "reaction mechanisms"] },
  { title: "Physical Chemistry", author: "Peter Atkins & Julio de Paula", subject: "Chemistry", edition: "11th Edition", price: 950, mrp: 1999, condition: "good", tags: ["physical chemistry", "thermodynamics"] },
  { title: "Inorganic Chemistry", author: "James E. Huheey et al.", subject: "Chemistry", edition: "4th Edition", price: 850, mrp: 1799, condition: "fair", tags: ["inorganic", "coordination chemistry"] },
  { title: "Concise Inorganic Chemistry", author: "J. D. Lee", subject: "Chemistry", edition: "5th Edition", price: 600, mrp: 1299, condition: "good", tags: ["inorganic", "reference"] },
  { title: "A Brief History of Time", author: "Stephen Hawking", subject: "Physics", edition: "Updated Edition", price: 300, mrp: 599, condition: "good", tags: ["popular science", "cosmology"] },
  { title: "The Alchemist", author: "Paulo Coelho", subject: "Literature", edition: "25th Anniversary Edition", price: 250, mrp: 499, condition: "like_new", tags: ["fiction", "personal growth"] },
  { title: "Ikigai", author: "Héctor García & Francesc Miralles", subject: "Personal Development", edition: "1st Edition", price: 220, mrp: 399, condition: "good", tags: ["wellness", "personal growth"] },
  { title: "Wings of Fire", author: "A. P. J. Abdul Kalam & Arun Tiwari", subject: "General Knowledge", edition: "1st Edition", price: 280, mrp: 450, condition: "good", tags: ["autobiography", "inspiration"] },
  { title: "Quantitative Aptitude for Competitive Examinations", author: "R. S. Aggarwal", subject: "Competitive Exams", edition: "Revised Edition", price: 450, mrp: 850, condition: "good", tags: ["aptitude", "exam preparation"] },
  { title: "Word Power Made Easy", author: "Norman Lewis", subject: "Competitive Exams", edition: "New Edition", price: 250, mrp: 499, condition: "like_new", tags: ["vocabulary", "English"] },
  { title: "Objective General English", author: "S. P. Bakshi", subject: "Competitive Exams", edition: "Revised Edition", price: 380, mrp: 750, condition: "good", tags: ["English", "exam preparation"] },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen et al.", subject: "Computer Science", edition: "4th Edition", price: 1500, mrp: 2999, condition: "good", tags: ["algorithms", "DSA"] },
  { title: "The C Programming Language", author: "Brian W. Kernighan & Dennis M. Ritchie", subject: "Computer Science", edition: "2nd Edition", price: 450, mrp: 999, condition: "fair", tags: ["C programming", "reference"] },
  { title: "Compilers: Principles, Techniques, and Tools", author: "Alfred V. Aho et al.", subject: "Computer Science", edition: "2nd Edition", price: 950, mrp: 1899, condition: "good", tags: ["compilers", "computer science"] },
  { title: "Computer Systems: A Programmer's Perspective", author: "Randal E. Bryant & David R. O'Hallaron", subject: "Computer Science", edition: "3rd Edition", price: 1100, mrp: 2199, condition: "like_new", tags: ["systems", "programming"] },
  { title: "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow", author: "Aurélien Géron", subject: "Computer Science", edition: "3rd Edition", price: 1200, mrp: 2499, condition: "good", tags: ["machine learning", "Python"] },
  { title: "The Linux Programming Interface", author: "Michael Kerrisk", subject: "Computer Science", edition: "1st Edition", price: 1000, mrp: 1999, condition: "good", tags: ["Linux", "systems programming"] },
  { title: "Engineering Circuit Analysis", author: "William H. Hayt et al.", subject: "Electronics & Communication", edition: "9th Edition", price: 850, mrp: 1799, condition: "fair", tags: ["circuits", "electrical engineering"] },
  { title: "Signals and Systems", author: "Alan V. Oppenheim & Alan S. Willsky", subject: "Electronics & Communication", edition: "2nd Edition", price: 900, mrp: 1899, condition: "good", tags: ["signals", "systems"] },
  { title: "Digital Signal Processing", author: "John G. Proakis & Dimitris G. Manolakis", subject: "Electronics & Communication", edition: "4th Edition", price: 1050, mrp: 2199, condition: "like_new", tags: ["DSP", "signal processing"] },
  { title: "Fundamentals of Electric Circuits", author: "Charles K. Alexander & Matthew N. O. Sadiku", subject: "Electrical Engineering", edition: "7th Edition", price: 950, mrp: 1999, condition: "good", tags: ["circuits", "electrical"] },
  { title: "Electrical Power Systems", author: "C. L. Wadhwa", subject: "Electrical Engineering", edition: "7th Edition", price: 750, mrp: 1599, condition: "fair", tags: ["power systems", "engineering"] },
  { title: "Fluid Mechanics", author: "Frank M. White", subject: "Mechanical Engineering", edition: "9th Edition", price: 900, mrp: 1899, condition: "good", tags: ["fluid mechanics", "engineering"] },
  { title: "Materials Science and Engineering", author: "William D. Callister & David G. Rethwisch", subject: "Mechanical Engineering", edition: "10th Edition", price: 1050, mrp: 2199, condition: "like_new", tags: ["materials", "engineering"] },
  { title: "Strength of Materials", author: "R. K. Bansal", subject: "Mechanical Engineering", edition: "6th Edition", price: 650, mrp: 1399, condition: "good", tags: ["mechanics", "structures"] },
  { title: "Marketing Management", author: "Philip Kotler & Kevin Lane Keller", subject: "Business Administration", edition: "16th Edition", price: 1100, mrp: 2299, condition: "good", tags: ["marketing", "management"] },
  { title: "The Personal MBA", author: "Josh Kaufman", subject: "Business Administration", edition: "10th Anniversary Edition", price: 500, mrp: 999, condition: "like_new", tags: ["business", "career"] },
  { title: "Business Statistics", author: "J. K. Sharma", subject: "Business Administration", edition: "5th Edition", price: 600, mrp: 1299, condition: "fair", tags: ["statistics", "business"] },
  { title: "Macroeconomics", author: "N. Gregory Mankiw", subject: "Economics", edition: "11th Edition", price: 850, mrp: 1799, condition: "good", tags: ["macroeconomics", "economics"] },
  { title: "The Undercover Economist", author: "Tim Harford", subject: "Economics", edition: "Revised Edition", price: 300, mrp: 599, condition: "like_new", tags: ["economics", "popular science"] },
  { title: "Differential Equations with Boundary-Value Problems", author: "Dennis G. Zill", subject: "Mathematics", edition: "9th Edition", price: 750, mrp: 1599, condition: "good", tags: ["differential equations", "mathematics"] },
  { title: "Numerical Methods for Engineers", author: "Steven C. Chapra & Raymond P. Canale", subject: "Mathematics", edition: "8th Edition", price: 950, mrp: 1999, condition: "fair", tags: ["numerical methods", "engineering"] },
  { title: "Chemistry: The Central Science", author: "Theodore L. Brown et al.", subject: "Chemistry", edition: "14th Edition", price: 1000, mrp: 2099, condition: "good", tags: ["chemistry", "textbook"] },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", subject: "Biology", edition: "1st Edition", price: 280, mrp: 550, condition: "like_new", tags: ["biology", "nonfiction"] },
  { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", subject: "Literature", edition: "42nd Anniversary Edition", price: 250, mrp: 499, condition: "good", tags: ["science fiction", "fiction"] },
  { title: "Atomic Habits", author: "James Clear", subject: "Personal Development", edition: "1st Edition", price: 350, mrp: 699, condition: "like_new", tags: ["habits", "self improvement"] },
  { title: "The Psychology of Money", author: "Morgan Housel", subject: "Economics", edition: "1st Edition", price: 300, mrp: 599, condition: "good", tags: ["personal finance", "psychology"] },
  { title: "Objective Mathematics", author: "R. D. Sharma", subject: "Competitive Exams", edition: "Revised Edition", price: 500, mrp: 999, condition: "fair", tags: ["mathematics", "exam preparation"] },
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

export const bookListings: Listing[] = books.map((book, index) => {
  const number = index + 1;
  const day = 24 - (number % 24);
  return {
    id: `lst_sample_book_${String(number).padStart(2, "0")}`,
    item_type: "book",
    is_sample: true,
    title: book.title,
    author: book.author,
    edition: book.edition,
    subject: book.subject,
    semester: `${(number % 4) + 1}${["st", "nd", "rd", "th"][number % 4]} year`,
    branch: book.subject,
    kind: "sell",
    condition: book.condition,
    price: book.price,
    mrp: book.mrp,
    negotiable: true,
    seller_id: sellers[index % sellers.length],
    college_id: colleges[number % colleges.length],
    pickup_location: "Campus library",
    status: "available",
    description: `A pre-owned copy of ${book.title}, suitable for campus study and reference. Contact the seller to confirm its condition and arrange a convenient handover.`,
    highlights: [book.edition, book.condition === "like_new" ? "Like-new copy" : "Student-owned copy"],
    tags: book.tags,
    hue: (number * 31) % 360,
    emoji: number % 2 === 0 ? "📗" : "📘",
    created_at: `2026-10-${String(day).padStart(2, "0")}T${String((number * 2) % 24).padStart(2, "0")}:00:00Z`,
    views: 18 + number * 4,
    saves: 2 + (number % 21),
    boosted: number % 11 === 0,
  };
});
