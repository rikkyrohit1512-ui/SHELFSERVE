/**
 * ShelfSense - Smart Library Management System
 * Sample Initial Mock Dataset for Phase 1 Prototype.
 * Includes Spatial Shelf Map Metadata and Top-Down Architectural Layout.
 * NOTE: Location routing and rack allocations are for academic demonstration.
 */

const INITIAL_MOCK_DATA = {
  categories: [
    "Computer Science",
    "Mechanical Engineering",
    "Electronics & Communication",
    "Mathematics",
    "Physics",
    "Management & Humanities"
  ],

  books: [
    {
      id: "BK-101",
      title: "Introduction to Algorithms (4th Edition)",
      author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest",
      isbn: "978-0262046305",
      category: "Computer Science",
      publisher: "MIT Press",
      year: 2022,
      totalCopies: 8,
      availableCopies: 7, // 1 copy issued out (LN-8803)
      floor: "Ground Floor",
      section: "Computer Science",
      rackId: "CS-01",
      shelfId: "Tier 2, Shelf B",
      location: "Ground Floor • CS Wing • Rack CS-01 (Tier 2, Shelf B)"
    },
    {
      id: "BK-102",
      title: "Operating System Concepts (10th Edition)",
      author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
      isbn: "978-1119456339",
      category: "Computer Science",
      publisher: "Wiley",
      year: 2021,
      totalCopies: 6,
      availableCopies: 5, // 1 copy issued out (LN-8804)
      floor: "Ground Floor",
      section: "Computer Science",
      rackId: "CS-02",
      shelfId: "Tier 1, Shelf A",
      location: "Ground Floor • CS Wing • Rack CS-02 (Tier 1, Shelf A)"
    },
    {
      id: "BK-103",
      title: "Database System Concepts (7th Edition)",
      author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
      isbn: "978-0078022159",
      category: "Computer Science",
      publisher: "McGraw-Hill",
      year: 2020,
      totalCopies: 10,
      availableCopies: 10, // 0 active loans (LN-8805 was returned)
      floor: "Ground Floor",
      section: "Computer Science",
      rackId: "CS-03",
      shelfId: "Tier 3, Shelf C",
      location: "Ground Floor • CS Wing • Rack CS-03 (Tier 3, Shelf C)"
    },
    {
      id: "BK-104",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      isbn: "978-0132350884",
      category: "Computer Science",
      publisher: "Prentice Hall",
      year: 2019,
      totalCopies: 5,
      availableCopies: 4, // 1 copy issued out (LN-8802)
      floor: "Ground Floor",
      section: "Computer Science",
      rackId: "CS-02",
      shelfId: "Tier 2, Shelf B",
      location: "Ground Floor • CS Wing • Rack CS-02 (Tier 2, Shelf B)"
    },
    {
      id: "BK-105",
      title: "Higher Engineering Mathematics (44th Edition)",
      author: "Dr. B.S. Grewal",
      isbn: "978-8193328491",
      category: "Mathematics",
      publisher: "Khanna Publishers",
      year: 2021,
      totalCopies: 12,
      availableCopies: 12,
      floor: "Ground Floor",
      section: "Mathematics",
      rackId: "MATH-01",
      shelfId: "Tier 2, Shelf D",
      location: "Ground Floor • Mathematics • Rack MATH-01 (Tier 2, Shelf D)"
    },
    {
      id: "BK-106",
      title: "Fluid Mechanics: Fundamentals & Applications",
      author: "Yunus A. Cengel, John M. Cimbala",
      isbn: "978-1259696534",
      category: "Mechanical Engineering",
      publisher: "McGraw-Hill",
      year: 2018,
      totalCopies: 4,
      availableCopies: 4,
      floor: "Ground Floor",
      section: "Mechanical Engineering",
      rackId: "MECH-01",
      shelfId: "Tier 1, Shelf A",
      location: "Ground Floor • Mech Engg • Rack MECH-01 (Tier 1, Shelf A)"
    },
    {
      id: "BK-107",
      title: "Electronic Devices and Circuit Theory",
      author: "Robert L. Boylestad, Louis Nashelsky",
      isbn: "978-0132622264",
      category: "Electronics & Communication",
      publisher: "Pearson Education",
      year: 2019,
      totalCopies: 6,
      availableCopies: 6,
      floor: "Ground Floor",
      section: "Electronics & Communication",
      rackId: "ECE-01",
      shelfId: "Tier 2, Shelf B",
      location: "Ground Floor • Electronics • Rack ECE-01 (Tier 2, Shelf B)"
    },
    {
      id: "BK-108",
      title: "Artificial Intelligence: A Modern Approach (4th Edition)",
      author: "Stuart Russell, Peter Norvig",
      isbn: "978-0134610993",
      category: "Computer Science",
      publisher: "Pearson",
      year: 2021,
      totalCopies: 3,
      availableCopies: 2, // 1 copy issued out (LN-8801)
      floor: "Ground Floor",
      section: "Computer Science",
      rackId: "CS-01",
      shelfId: "Tier 3, Shelf A",
      location: "Ground Floor • CS Wing • Rack CS-01 (Tier 3, Shelf A)"
    },
    {
      id: "BK-109",
      title: "Concepts of Modern Physics (6th Edition)",
      author: "Arthur Beiser",
      isbn: "978-0070495531",
      category: "Physics",
      publisher: "McGraw-Hill",
      year: 2020,
      totalCopies: 5,
      availableCopies: 5,
      floor: "Ground Floor",
      section: "Physics",
      rackId: "PHY-01",
      shelfId: "Tier 1, Shelf C",
      location: "Ground Floor • Physics Wing • Rack PHY-01 (Tier 1, Shelf C)"
    },
    {
      id: "BK-110",
      title: "The Design of Everyday Things",
      author: "Don Norman",
      isbn: "978-0465050659",
      category: "Management & Humanities",
      publisher: "Basic Books",
      year: 2018,
      totalCopies: 4,
      availableCopies: 4,
      floor: "Ground Floor",
      section: "General Books",
      rackId: "GEN-01",
      shelfId: "Tier 2, Shelf A",
      location: "Ground Floor • General Wing • Rack GEN-01 (Tier 2, Shelf A)"
    },
    {
      id: "BK-111",
      title: "IEEE Transactions & Research Methodologies",
      author: "Dr. K.V. Ramanathan",
      isbn: "978-1424428052",
      category: "Computer Science",
      publisher: "IEEE Press",
      year: 2023,
      totalCopies: 3,
      availableCopies: 3,
      floor: "1st Floor",
      section: "Advanced Research & Periodicals",
      rackId: "RES-01",
      shelfId: "Tier 1, Shelf A",
      location: "1st Floor • Research Wing • Rack RES-01 (Tier 1, Shelf A)"
    },
    {
      id: "BK-112",
      title: "Cloud Infrastructure & Serverless Microservices",
      author: "Martin Fowler, Sam Newman",
      isbn: "978-1492043454",
      category: "Computer Science",
      publisher: "O'Reilly Media",
      year: 2024,
      totalCopies: 10,
      availableCopies: 10,
      floor: null, // Test case: Digital/Archived book with NO assigned physical shelf
      section: null,
      rackId: null,
      shelfId: null,
      location: "Digital Library Repository (No physical shelf assigned)"
    }
  ],

  members: [
    {
      id: "MEM-201",
      name: "Aarav Sharma",
      rollNo: "21BCSE042",
      role: "STUDENT",
      department: "Computer Science & Engineering",
      email: "aarav.cse21@college.edu",
      phone: "+91 98231 45678",
      status: "ACTIVE",
      maxAllowedLoans: 3
    },
    {
      id: "MEM-202",
      name: "Priya Sundaram",
      rollNo: "21BCSE088",
      role: "STUDENT",
      department: "Computer Science & Engineering",
      email: "priya.cse21@college.edu",
      phone: "+91 98345 67890",
      status: "ACTIVE",
      maxAllowedLoans: 3
    },
    {
      id: "MEM-203",
      name: "Rohan Kulkarni",
      rollNo: "22BME019",
      role: "STUDENT",
      department: "Mechanical Engineering",
      email: "rohan.me22@college.edu",
      phone: "+91 98112 33445",
      status: "ACTIVE",
      maxAllowedLoans: 3
    },
    {
      id: "MEM-204",
      name: "Ananya Iyer",
      rollNo: "22BECE034",
      role: "STUDENT",
      department: "Electronics & Communication",
      email: "ananya.ece22@college.edu",
      phone: "+91 97456 12389",
      status: "ACTIVE",
      maxAllowedLoans: 3
    },
    {
      id: "MEM-205",
      name: "Dr. Sunita Rao",
      rollNo: "FAC-CSE-012",
      role: "FACULTY",
      department: "Computer Science & Engineering",
      email: "sunita.rao@college.edu",
      phone: "+91 98450 11223",
      status: "ACTIVE",
      maxAllowedLoans: 6
    }
  ],

  // Circulation Loans (2 Overdue, 2 Active Issued, 1 Returned)
  transactions: [
    {
      id: "LN-8801",
      bookId: "BK-108",
      bookTitle: "Artificial Intelligence: A Modern Approach (4th Edition)",
      memberId: "MEM-201",
      memberName: "Aarav Sharma",
      memberRoll: "21BCSE042",
      issueDate: "2026-10-05",
      dueDate: "2026-10-19",
      returnDate: null,
      status: "OVERDUE",
      finePerDay: 5,
      calculatedFine: 70,
      finePaid: false
    },
    {
      id: "LN-8802",
      bookId: "BK-104",
      bookTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
      memberId: "MEM-203",
      memberName: "Rohan Kulkarni",
      memberRoll: "22BME019",
      issueDate: "2026-10-10",
      dueDate: "2026-10-24",
      returnDate: null,
      status: "OVERDUE",
      finePerDay: 5,
      calculatedFine: 45,
      finePaid: false
    },
    {
      id: "LN-8803",
      bookId: "BK-101",
      bookTitle: "Introduction to Algorithms (4th Edition)",
      memberId: "MEM-202",
      memberName: "Priya Sundaram",
      memberRoll: "21BCSE088",
      issueDate: "2026-10-25",
      dueDate: "2026-11-08",
      returnDate: null,
      status: "ISSUED",
      finePerDay: 5,
      calculatedFine: 0,
      finePaid: false
    },
    {
      id: "LN-8804",
      bookId: "BK-102",
      bookTitle: "Operating System Concepts (10th Edition)",
      memberId: "MEM-204",
      memberName: "Ananya Iyer",
      memberRoll: "22BECE034",
      issueDate: "2026-10-28",
      dueDate: "2026-11-11",
      returnDate: null,
      status: "ISSUED",
      finePerDay: 5,
      calculatedFine: 0,
      finePaid: false
    },
    {
      id: "LN-8805",
      bookId: "BK-103",
      bookTitle: "Database System Concepts (7th Edition)",
      memberId: "MEM-205",
      memberName: "Dr. Sunita Rao",
      memberRoll: "FAC-CSE-012",
      issueDate: "2026-09-15",
      dueDate: "2026-10-15",
      returnDate: "2026-10-12",
      status: "RETURNED",
      finePerDay: 5,
      calculatedFine: 0,
      finePaid: false
    }
  ]
};

/**
 * Floor Map Topology and Metadata Configuration
 * Used for top-down floor rendering, rack indexing, and turn-by-turn directions.
 */
const FLOOR_LAYOUT_DATA = {
  floors: ["Ground Floor", "1st Floor"],
  
  "Ground Floor": {
    name: "Ground Floor — Main Academic Stacks & Reading Hall",
    entrance: {
      name: "Main South Entrance",
      label: "ENTRY & RFID GATE",
      position: { x: 375, y: 550 }
    },
    zones: [
      { id: "ZONE_ENTRANCE", name: "Entrance & Circulation Counter", bounds: { x: 260, y: 460, w: 230, h: 100 } },
      { id: "ZONE_READING", name: "Quiet Study & Reading Carrels", bounds: { x: 520, y: 180, w: 220, h: 360 } },
      { id: "ZONE_CS", name: "Computer Science & IT Section", bounds: { x: 30, y: 40, w: 220, h: 220 } },
      { id: "ZONE_MATH", name: "Mathematics & Computing", bounds: { x: 270, y: 40, w: 220, h: 180 } },
      { id: "ZONE_PHYSICS", name: "Physics & Natural Sciences", bounds: { x: 30, y: 280, w: 220, h: 160 } },
      { id: "ZONE_GENERAL", name: "Engineering & Humanities", bounds: { x: 270, y: 240, w: 220, h: 200 } }
    ],
    racks: [
      {
        id: "CS-01",
        label: "CS-01",
        section: "Computer Science",
        subject: "Algorithms, Data Structures & AI",
        x: 55, y: 80, w: 75, h: 42,
        directions: "Enter the library through the South Entrance, walk past the Circulation Reception Desk into the Central Promenade, turn left into the Computer Science Wing, and locate Rack CS-01 at the front-left aisle."
      },
      {
        id: "CS-02",
        label: "CS-02",
        section: "Computer Science",
        subject: "Operating Systems, Architecture & Software Eng",
        x: 150, y: 80, w: 75, h: 42,
        directions: "Enter through the South Entrance, proceed straight past Reception into the Central Aisle, take the first left into the CS Section, and find Rack CS-02 in the middle row."
      },
      {
        id: "CS-03",
        label: "CS-03",
        section: "Computer Science",
        subject: "Databases, Networks & Cloud Systems",
        x: 55, y: 155, w: 75, h: 42,
        directions: "From the South Entrance, walk past Reception into the Central Aisle, turn left towards the back of the CS Wing to locate Rack CS-03."
      },
      {
        id: "MATH-01",
        label: "MATH-01",
        section: "Mathematics",
        subject: "Engineering Mathematics & Calculus",
        x: 295, y: 80, w: 75, h: 42,
        directions: "Enter through the South Entrance, walk straight up the Central Aisle directly towards the north wall to find the Mathematics Wing; Rack MATH-01 is on the left."
      },
      {
        id: "MATH-02",
        label: "MATH-02",
        section: "Mathematics",
        subject: "Discrete Mathematics & Numerical Methods",
        x: 390, y: 80, w: 75, h: 42,
        directions: "Enter through the South Entrance, follow the Central Aisle straight north into the Mathematics Wing, and locate Rack MATH-02 on the right."
      },
      {
        id: "PHY-01",
        label: "PHY-01",
        section: "Physics",
        subject: "Engineering Physics & Quantum Mechanics",
        x: 55, y: 320, w: 75, h: 42,
        directions: "From the South Entrance, turn immediately left before the Central Aisle into the Physics & Materials Section; locate Rack PHY-01 along the western wall."
      },
      {
        id: "PHY-02",
        label: "PHY-02",
        section: "Physics",
        subject: "Optics, Waves & Thermodynamics",
        x: 150, y: 320, w: 75, h: 42,
        directions: "From the South Entrance, turn left into the Physics Section and walk to the second row to find Rack PHY-02."
      },
      {
        id: "MECH-01",
        label: "MECH-01",
        section: "Mechanical Engineering",
        subject: "Fluid Mechanics & Machine Design",
        x: 295, y: 280, w: 75, h: 42,
        directions: "Enter through the South Entrance, head north past the Reception, take a slight right into the Engineering & General Section to find Rack MECH-01."
      },
      {
        id: "ECE-01",
        label: "ECE-01",
        section: "Electronics & Communication",
        subject: "Circuits, VLSI & Signal Processing",
        x: 390, y: 280, w: 75, h: 42,
        directions: "From the South Entrance, proceed past the Reception Desk, turn right into the Engineering Section to locate Rack ECE-01."
      },
      {
        id: "GEN-01",
        label: "GEN-01",
        section: "General Books",
        subject: "Design, Philosophy & Human Values",
        x: 295, y: 350, w: 75, h: 42,
        directions: "Enter through the South Entrance, proceed towards the Central Promenade, locate Rack GEN-01 in the General Books bay adjacent to the reading tables."
      },
      {
        id: "GEN-02",
        label: "GEN-02",
        section: "General Books",
        subject: "Encyclopedias & Reference Lexicons",
        x: 390, y: 350, w: 75, h: 42,
        directions: "From the South Entrance, head past the Reception into the General Reference aisle to locate Rack GEN-02."
      }
    ]
  },

  "1st Floor": {
    name: "1st Floor — Advanced Research, Periodicals & Digital Labs",
    entrance: {
      name: "Central Staircase & Elevator Access",
      label: "STAIRS & ELEVATOR",
      position: { x: 375, y: 550 }
    },
    zones: [
      { id: "ZONE_DIGITAL", name: "Digital Library (30 Terminals)", bounds: { x: 30, y: 40, w: 460, h: 200 } },
      { id: "ZONE_PERIODICALS", name: "Bound Journals & Magazines", bounds: { x: 30, y: 260, w: 220, h: 180 } },
      { id: "ZONE_RESEARCH", name: "Faculty & Doctoral Carrels", bounds: { x: 270, y: 260, w: 220, h: 180 } },
      { id: "ZONE_DISCUSSION", name: "Group Discussion Rooms 101-102", bounds: { x: 520, y: 180, w: 220, h: 360 } }
    ],
    racks: [
      {
        id: "RES-01",
        label: "RES-01",
        section: "Advanced Research & Periodicals",
        subject: "IEEE Transactions, ACM Journals & Theses",
        x: 295, y: 300, w: 75, h: 42,
        directions: "Take the central stairs or elevator to the 1st Floor, step out into the Research Wing foyer, turn right, and locate Rack RES-01 along the research aisle."
      },
      {
        id: "RES-02",
        label: "RES-02",
        section: "Advanced Research & Periodicals",
        subject: "Doctoral Dissertations & Conference Papers",
        x: 390, y: 300, w: 75, h: 42,
        directions: "On the 1st Floor, proceed towards the Faculty Carrels to find Rack RES-02 in the research repository."
      },
      {
        id: "PER-01",
        label: "PER-01",
        section: "Periodicals Archive",
        subject: "Quarterly Academic Reviews",
        x: 55, y: 300, w: 75, h: 42,
        directions: "Take the central stairs to the 1st Floor, turn left into the Periodicals Wing, and locate Rack PER-01 on your right."
      },
      {
        id: "PER-02",
        label: "PER-02",
        section: "Periodicals Archive",
        subject: "International Engineering Symposia",
        x: 150, y: 300, w: 75, h: 42,
        directions: "On the 1st Floor, enter the Periodicals room and find Rack PER-02 in the second row."
      }
    ]
  }
};
