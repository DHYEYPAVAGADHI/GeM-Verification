import type { Locale } from "./config";

/**
 * Message catalogue for the public-facing surface (marketing site + auth
 * screens). Keys are grouped by area. Proper nouns and statutory identifiers
 * (GeM, PAN, GSTIN, Udyam, MSME, DPIIT, NetworkX, OpenCV, Claude) are kept in
 * Latin script in both languages, as is standard on Indian government portals.
 */
const en = {
  common: {
    signIn: "Sign in",
    signUp: "Sign Up",
    register: "Register",
    createAccount: "Create an account",
    officerLogin: "Procurement Officer Login",
    backToWebsite: "Back to the website",
    learnMore: "Learn more",
    language: "Language",
  },

  nav: {
    home: "Home",
    ongoingBids: "Ongoing Bids",
    aiServices: "AI Verification Services",
    policies: "Policies",
    helpdesk: "Helpdesk",
  },

  header: {
    tollFree: "Toll-Free 1800-419-3436",
    skipToContent: "Skip to Main Content",
    screenReader: "Screen Reader Access",
    textSize: "Text size",
    searchPlaceholder: "Search bids, tenders, policies, compliance reports…",
    search: "Search",
    categories: {
      all: "All Categories",
      bids: "Ongoing Bids",
      tenderDocs: "Tender Documents",
      complianceReports: "Compliance Reports",
      policyCirculars: "Policy Circulars",
      vendorRegistrations: "Vendor Registrations",
    },
  },

  ticker: {
    live: "Live",
    pause: "Pause scrolling alerts",
    resume: "Resume scrolling alerts",
    items: [
      "ALERT: New OpenCV forensic tamper-detection rules implemented across all live tenders.",
      "UPDATE: Automatic EMD exemptions now live for Udyam-verified MSEs and DPIIT-recognised Startups.",
      "NOTICE: NetworkX Cartel Radar now cross-checks Director Identification Numbers against MCA21.",
      "ALERT: GSTIN / PAN sandbox verification latency restored to normal after scheduled maintenance.",
    ],
  },

  heroStrip: {
    sih: "Smart India Hackathon 2026 · Problem Statement 26100",
  },

  hero: {
    flagship: {
      eyebrow: "Smart India Hackathon 2026 · PS 26100",
      headline: ["Transforming Public", "Procurement with AI"],
      sub: "Accelerating technical evaluation by 80% with zero tolerance for forgery",
      primary: "View AI Audit Demo",
      secondary: "Read GIGW Guidelines",
    },
    speed: {
      eyebrow: "Faster Evaluation",
      headline: ["From weeks of scrutiny", "to a same-day decision"],
      sub: "Multimodal extraction and a deterministic rule engine on every bid packet",
      primary: "See the Pipeline",
      secondary: "Stakeholder Portals",
    },
    forensics: {
      eyebrow: "Document Forensics",
      headline: ["Zero tolerance for", "document forgery"],
      sub: "Error-Level-Analysis & OpenCV tamper detection on seals and figures",
      primary: "See Forensics in Action",
      secondary: "Explore Capabilities",
    },
    cartel: {
      eyebrow: "Cartel & Collusion Radar",
      headline: ["Spot bid-rigging", "syndicates in one graph"],
      sub: "Relational graphing on shared directors, addresses and bank accounts",
      primary: "Open Vigilance Console",
      secondary: "How It Works",
    },
    exemptions: {
      eyebrow: "Make in India",
      headline: ["Automatic exemptions for", "MSEs and DPIIT Startups"],
      sub: "EMD and prior-turnover relaxations applied the moment Udyam is verified",
      primary: "Register as a Vendor",
      secondary: "Read MSE Order 2012",
    },
    integration: {
      eyebrow: "Connected Sources",
      headline: ["Eleven government", "registries, one check"],
      sub: "Udyam · GSTN · PAN · MCA21 · EPFO · ESIC · DPIIT · NSIC and more",
      primary: "View AI Audit Demo",
      secondary: "Connected Sources",
    },
  },

  stats: {
    eyebrow: "Live platform metrics",
    heading: "Real-time impact across the Government e-Marketplace",
    updated: "Updated",
    disclaimer: "Figures are illustrative prototype data for Smart India Hackathon 2026.",
    items: {
      bids: "Total Bids Evaluated via AI",
      hours: "Processing Hours Saved",
      tampered: "Tampered Documents Flagged",
      funds: "Public Funds Protected",
    },
  },

  portals: {
    eyebrow: "Stakeholder portals",
    heading: "One platform, three points of entry",
    sub: "Buyers evaluate, sellers track, and vigilance teams investigate — each with a purpose-built console.",
    officer: {
      audience: "Procurement Officers",
      role: "Buyers",
      body: "Log in to ingest tenders, set eligibility rules, and view a bidder-by-bidder compliance matrix with click-to-source evidence.",
      points: [
        "Bulk tender & bid-packet ingestion",
        "Compliance score and risk ranking",
        "Record decisions with a hash-chained dossier",
      ],
      cta: "Procurement Officer Login",
    },
    vendor: {
      audience: "Bidders / Vendors",
      role: "Sellers",
      body: "Track evaluation status in real time and see automated MSE and DPIIT-Startup exemptions applied to your bid — no black-box rejections.",
      points: [
        "Live evaluation status tracker",
        "Automatic EMD & turnover exemptions",
        "Guided seven-step bid submission wizard",
      ],
      cta: "Register as a Vendor",
    },
    vigilance: {
      audience: "Vigilance / Audit",
      role: "Oversight",
      body: "Access the NetworkX Cartel Radar to surface bid-rigging syndicates — supposedly competing firms sharing a director, address or bank account.",
      points: [
        "Relational graph of bidder linkages",
        "Tamper-detection forensic queue",
        "Full audit trail and export",
      ],
      cta: "Open Vigilance Console",
    },
  },

  capabilities: {
    eyebrow: "AI verification capabilities",
    heading: "Detection that goes far beyond an active / inactive status check",
    sub: "Six engines run on every bid packet — extraction, forensics, graph analysis, policy routing, source verification and a fully auditable trail.",
    footNote: "The AI recommends. The Procurement Officer decides. Every override is recorded.",
    items: [
      {
        title: "Multimodal Vision Extraction",
        meta: "Claude 3.5 Sonnet",
        body: "High-accuracy structured extraction from degraded scans and non-standard certificate layouts — identifiers, dates, turnover and local-content figures.",
      },
      {
        title: "Network Relational Graphing",
        meta: "Cartel Check",
        body: "NetworkX graph engine flags collusion between bidders that share a Director Identification Number, registered address or bank account.",
      },
      {
        title: "Error Level Analysis",
        meta: "Image Forensics",
        body: "OpenCV-driven ELA heatmaps highlight digitally altered figures on balance sheets, turnover certificates and statutory seals.",
      },
      {
        title: "Dynamic Policy Routing",
        meta: "Make-in-India",
        body: "Automatically applies MII local-content thresholds, MSE Order 2012 relaxations and Startup exemptions to each bidder's rule set.",
      },
      {
        title: "Sandbox API Integration",
        meta: "GSTIN / PAN",
        body: "Cross-verifies every identifier against the Udyam, GSTN, PAN, MCA21 and EPFO sandbox — contracts that mirror live KYC-aggregator APIs.",
      },
      {
        title: "Zero Black-Box Auditing",
        meta: "Click-to-Source",
        body: "Every flag and score links to the exact highlighted line on the original document, so an officer can defend the evaluation on the record.",
      },
    ],
  },

  finalCta: {
    heading: "See a full bidder verification, end to end",
    sub: "Sign in with a demo officer account to walk a tender through compliance scoring, forgery flags, the cartel graph, click-to-source evidence and the audit trail.",
    primary: "View AI Audit Demo",
    secondary: "Create an account",
  },

  footer: {
    address: "Government e-Marketplace, Jeevan Tara Building, Sansad Marg, New Delhi – 110001",
    tollFree: "Toll-Free 1800-419-3436",
    blurb:
      "An AI-powered integrated bid compliance verification platform accelerating technical evaluation while enforcing zero tolerance for document forgery — decision support for the Procurement Officer, never a black box.",
    nic: "National Informatics Centre",
    copyright:
      "© 2026 Government e-Marketplace. Designed for Smart India Hackathon (SIH 2026) by Team HACK-ATHLETE. Compliant with GIGW 3.0.",
    columns: {
      about: {
        title: "About GeM",
        links: [
          "Platform Vision & Mission",
          "AI Bid Compliance Overview",
          "Problem Statement 26100 (SIH 2026)",
          "Newsroom & Press Releases",
          "Careers with GeM",
          "Contact the Programme Office",
        ],
      },
      policies: {
        title: "Policies",
        links: [
          "Privacy Policy",
          "Terms of Use",
          "Make-in-India (MII) Order 2017",
          "Public Procurement (MSE) Order 2012",
          "General Financial Rules (GFR) 2017",
          "GIGW 3.0 Accessibility Statement",
        ],
      },
      help: {
        title: "Help & Training",
        links: [
          "Raise a Support Ticket",
          "Procurement Officer Training",
          "Vendor Onboarding Guide",
          "Video Tutorials & Webinars",
          "Frequently Asked Questions",
          "Downloads & User Manuals",
        ],
      },
      links: {
        title: "Important Links",
        links: [
          "Startup India",
          "Digital India",
          "Make in India",
          "Udyam Registration",
          "GST Portal",
          "MCA21 Portal",
          "Central Public Procurement Portal",
        ],
      },
    },
  },

  authShell: {
    heading: "AI-Powered Integrated Bid Compliance Verification Platform",
    blurb:
      "Officers configure tenders, verify statutory documents and record decisions. Vendors register, prepare and submit bids. Every action is logged to a tamper-evident trail.",
    prototype: "SIH 2026 prototype · Problem Statement 26100",
  },

  login: {
    title: "Sign in",
    subtitle: "Enter your credentials to continue. New to the platform?",
    applyNotice: "Sign in to participate in this bid. We'll take you straight to its upload screen.",
    email: "Email",
    password: "Password",
    signingIn: "Signing in…",
    orWithEmail: "or with email",
    continueGoogle: "Continue with Google",
    connecting: "Connecting…",
    demoAccounts: "Demo accounts · password Demo@12345",
    roles: {
      officer: "Procurement Officer",
      apollo: "Vendor — Apollo Technologies",
      greenfield: "Vendor — Greenfield Traders",
    },
    goes: {
      console: "Verification console",
      portal: "Bidder portal",
    },
  },

  register: {
    title: "Create your account",
    already: "Already registered?",
    creatingVendor: "Registering & issuing MPIN…",
    creatingOfficer: "Creating account…",
    submitVendor: "Register & get MPIN",
    submitOfficer: "Create account",
    roleVendor: "Vendor / Bidder",
    roleOfficer: "Procurement Officer",
    sections: {
      account: "Account",
      entity: "Entity details",
      statutory: "Statutory identifiers",
      msme: "MSME / Startup",
      financials: "Financials & compliance",
      director: "Authorised director / signatory",
    },
    fields: {
      legalName: "Registered / legal name of entity",
      fullName: "Full name",
      workEmail: "Work email",
      govEmail: "Government email",
      password: "Password",
      confirm: "Confirm password",
      constitution: "Constitution",
      cin: "CIN / LLPIN",
      cinHint: "(if incorporated)",
      address: "Registered address",
      addressPlaceholder: "Building, street, city, PIN",
      state: "State / UT",
      sector: "Primary sector",
      optional: "(optional)",
      pan: "PAN",
      gstin: "GSTIN",
      aadhaar: "Aadhaar of authorised signatory",
      aadhaarHint: "(optional · stored masked)",
      aadhaarPlaceholder: "12-digit Aadhaar",
      msmeQuestion: "Is the entity registered as an MSME (Udyam)?",
      msmeNo: "No",
      msmeYes: "Yes — Udyam registered",
      udyam: "Udyam registration no.",
      msmeClass: "MSME class",
      turnover: "Last FY turnover (₹ crore)",
      caUdin: "CA UDIN on turnover statement",
      mii: "Make-in-India local content (%)",
      directorName: "Director name",
      directorNamePlaceholder: "As per MCA records",
      directorDin: "Director DIN",
      dinPlaceholder: "8-digit DIN",
      select: "Select…",
    },
    mpinNotice:
      "On submission your details are recorded in the national bidder registry and you are issued a unique 6-digit MPIN. You will need the MPIN to enter any tender, so save it when it is shown.",
    terms:
      "By registering you confirm the information provided is accurate and agree to the platform's Terms of Use. This is a prototype environment.",
  },

  mpin: {
    title: "Your MPIN",
    intro: "is now on the national bidder registry",
    introAs: "as",
    introTail: "This 6-digit MPIN is your signing key for every tender — it is shown once.",
    label: "Your MPIN",
    copy: "Copy",
    copied: "Copied",
    warning:
      "Write this down now. For security it is never shown again in full — later you can only view it from your profile after re-entering your account password.",
    ack: "I have saved my MPIN in a safe place.",
    continue: "Continue to portal",
    continuing: "Continuing…",
  },

  tenders: {
    title: "Ongoing Bids",
    subtitle:
      "live bid opportunities across central ministries and departments. Browsing is open to all — signing in is required only to participate.",
    infoBanner:
      "Selecting Participate verifies your entity by PAN or GSTIN against the GeM registry. Verified entities go straight to the application; new entities are routed to a quick onboarding wizard.",
    searchPlaceholder: "Search by item or GeM bid number…",
    ministry: "Ministry",
    allMinistries: "All ministries",
    sort: "Sort",
    sortEndAsc: "Closing soonest",
    sortEndDesc: "Closing latest",
    sortValueDesc: "Highest value",
    showing: "Showing",
    of: "of",
    bids: "bids",
    participate: "Participate",
    mseExempt: "MSE / EMD exempt",
    daysLeft: "days left",
    dayLeft: "day left",
    closed: "Closed",
    noResults: "No ongoing bids match your filters.",
    cols: {
      bidNo: "GeM Bid No.",
      item: "Item / Category",
      ministry: "Ministry / Department",
      quantity: "Quantity",
      endDate: "Bid End Date",
      action: "Action",
    },
  },
};

export type Dict = typeof en;

/* --------------------------------- हिन्दी --------------------------------- */

const hi: Dict = {
  common: {
    signIn: "साइन इन करें",
    signUp: "पंजीकरण करें",
    register: "पंजीकरण",
    createAccount: "खाता बनाएँ",
    officerLogin: "क्रय अधिकारी लॉगिन",
    backToWebsite: "वेबसाइट पर वापस जाएँ",
    learnMore: "और जानें",
    language: "भाषा",
  },

  nav: {
    home: "मुख पृष्ठ",
    ongoingBids: "चालू निविदाएँ",
    aiServices: "AI सत्यापन सेवाएँ",
    policies: "नीतियाँ",
    helpdesk: "सहायता केंद्र",
  },

  header: {
    tollFree: "टोल-फ्री 1800-419-3436",
    skipToContent: "मुख्य सामग्री पर जाएँ",
    screenReader: "स्क्रीन रीडर एक्सेस",
    textSize: "अक्षर आकार",
    searchPlaceholder: "निविदाएँ, नीतियाँ, अनुपालन रिपोर्ट खोजें…",
    search: "खोजें",
    categories: {
      all: "सभी श्रेणियाँ",
      bids: "चालू निविदाएँ",
      tenderDocs: "निविदा दस्तावेज़",
      complianceReports: "अनुपालन रिपोर्ट",
      policyCirculars: "नीति परिपत्र",
      vendorRegistrations: "विक्रेता पंजीकरण",
    },
  },

  ticker: {
    live: "लाइव",
    pause: "स्क्रॉल हो रही सूचनाएँ रोकें",
    resume: "स्क्रॉल हो रही सूचनाएँ जारी रखें",
    items: [
      "सूचना: सभी चालू निविदाओं पर नए OpenCV फोरेंसिक छेड़छाड़-पहचान नियम लागू किए गए।",
      "अद्यतन: Udyam-सत्यापित MSE और DPIIT-मान्यता प्राप्त Startups के लिए स्वतः EMD छूट अब उपलब्ध।",
      "नोटिस: NetworkX कार्टेल रडार अब Director Identification Number का MCA21 से मिलान करता है।",
      "सूचना: निर्धारित रखरखाव के बाद GSTIN / PAN सैंडबॉक्स सत्यापन विलंब सामान्य हुआ।",
    ],
  },

  heroStrip: {
    sih: "स्मार्ट इंडिया हैकाथॉन 2026 · समस्या कथन 26100",
  },

  hero: {
    flagship: {
      eyebrow: "स्मार्ट इंडिया हैकाथॉन 2026 · PS 26100",
      headline: ["AI के साथ सार्वजनिक", "क्रय का रूपांतरण"],
      sub: "जालसाज़ी पर शून्य सहिष्णुता के साथ तकनीकी मूल्यांकन में 80% तेज़ी",
      primary: "AI ऑडिट डेमो देखें",
      secondary: "GIGW दिशानिर्देश पढ़ें",
    },
    speed: {
      eyebrow: "तेज़ मूल्यांकन",
      headline: ["हफ़्तों की जाँच से", "उसी दिन निर्णय तक"],
      sub: "हर बिड पैकेट पर बहु-रूपात्मक निष्कर्षण और निश्चयात्मक नियम इंजन",
      primary: "प्रक्रिया देखें",
      secondary: "हितधारक पोर्टल",
    },
    forensics: {
      eyebrow: "दस्तावेज़ फोरेंसिक",
      headline: ["दस्तावेज़ जालसाज़ी पर", "शून्य सहिष्णुता"],
      sub: "मुहरों और आँकड़ों पर Error-Level-Analysis और OpenCV छेड़छाड़ पहचान",
      primary: "फोरेंसिक क्रियाशील देखें",
      secondary: "क्षमताएँ देखें",
    },
    cartel: {
      eyebrow: "कार्टेल एवं मिलीभगत रडार",
      headline: ["एक ही ग्राफ़ में बिड-रिगिंग", "गिरोहों की पहचान"],
      sub: "साझा निदेशक, पता और बैंक खातों पर संबंध-ग्राफ़ विश्लेषण",
      primary: "सतर्कता कंसोल खोलें",
      secondary: "यह कैसे काम करता है",
    },
    exemptions: {
      eyebrow: "मेक इन इंडिया",
      headline: ["MSE और DPIIT Startups के लिए", "स्वतः छूट"],
      sub: "Udyam सत्यापित होते ही EMD और पूर्व-टर्नओवर में छूट लागू",
      primary: "विक्रेता के रूप में पंजीकरण करें",
      secondary: "MSE आदेश 2012 पढ़ें",
    },
    integration: {
      eyebrow: "संबद्ध स्रोत",
      headline: ["ग्यारह सरकारी रजिस्ट्रियाँ,", "एक ही जाँच"],
      sub: "Udyam · GSTN · PAN · MCA21 · EPFO · ESIC · DPIIT · NSIC और अन्य",
      primary: "AI ऑडिट डेमो देखें",
      secondary: "संबद्ध स्रोत",
    },
  },

  stats: {
    eyebrow: "लाइव प्लेटफ़ॉर्म आँकड़े",
    heading: "गवर्नमेंट ई-मार्केटप्लेस पर वास्तविक-समय प्रभाव",
    updated: "अद्यतन",
    disclaimer: "आँकड़े स्मार्ट इंडिया हैकाथॉन 2026 हेतु उदाहरणात्मक प्रोटोटाइप डेटा हैं।",
    items: {
      bids: "AI द्वारा मूल्यांकित कुल बिड",
      hours: "बचाए गए प्रसंस्करण घंटे",
      tampered: "चिह्नित छेड़छाड़युक्त दस्तावेज़",
      funds: "संरक्षित सार्वजनिक धन",
    },
  },

  portals: {
    eyebrow: "हितधारक पोर्टल",
    heading: "एक मंच, प्रवेश के तीन द्वार",
    sub: "क्रेता मूल्यांकन करते हैं, विक्रेता प्रगति देखते हैं, और सतर्कता दल जाँच करते हैं — प्रत्येक के लिए उद्देश्य-निर्मित कंसोल।",
    officer: {
      audience: "क्रय अधिकारी",
      role: "क्रेता",
      body: "निविदाएँ लें, पात्रता नियम तय करें, और क्लिक-टू-सोर्स साक्ष्य के साथ बिडर-दर-बिडर अनुपालन मैट्रिक्स देखें।",
      points: [
        "थोक निविदा एवं बिड-पैकेट ग्रहण",
        "अनुपालन स्कोर और जोखिम रैंकिंग",
        "हैश-चेन युक्त डोज़ियर के साथ निर्णय दर्ज करें",
      ],
      cta: "क्रय अधिकारी लॉगिन",
    },
    vendor: {
      audience: "बिडर / विक्रेता",
      role: "विक्रेता",
      body: "मूल्यांकन की स्थिति वास्तविक-समय में देखें और अपनी बिड पर स्वतः लागू MSE व DPIIT-Startup छूट देखें — कोई ब्लैक-बॉक्स अस्वीकृति नहीं।",
      points: [
        "लाइव मूल्यांकन स्थिति ट्रैकर",
        "स्वतः EMD एवं टर्नओवर छूट",
        "मार्गदर्शित सात-चरणीय बिड सबमिशन विज़ार्ड",
      ],
      cta: "विक्रेता के रूप में पंजीकरण करें",
    },
    vigilance: {
      audience: "सतर्कता / अंकेक्षण",
      role: "निरीक्षण",
      body: "NetworkX कार्टेल रडार से बिड-रिगिंग गिरोहों को उजागर करें — कथित रूप से प्रतिस्पर्धी फर्में जो निदेशक, पता या बैंक खाता साझा करती हैं।",
      points: [
        "बिडर संबंधों का संबंध-ग्राफ़",
        "छेड़छाड़-पहचान फोरेंसिक कतार",
        "पूर्ण अंकेक्षण अभिलेख और निर्यात",
      ],
      cta: "सतर्कता कंसोल खोलें",
    },
  },

  capabilities: {
    eyebrow: "AI सत्यापन क्षमताएँ",
    heading: "सक्रिय / निष्क्रिय स्थिति जाँच से कहीं आगे की पहचान",
    sub: "हर बिड पैकेट पर छह इंजन चलते हैं — निष्कर्षण, फोरेंसिक, ग्राफ़ विश्लेषण, नीति रूटिंग, स्रोत सत्यापन और पूर्णतः अंकेक्षणीय अभिलेख।",
    footNote: "AI अनुशंसा करता है। क्रय अधिकारी निर्णय लेते हैं। हर अधिभावी निर्णय दर्ज होता है।",
    items: [
      {
        title: "Multimodal Vision Extraction",
        meta: "Claude 3.5 Sonnet",
        body: "क्षतिग्रस्त स्कैन और गैर-मानक प्रमाणपत्र लेआउट से उच्च-सटीकता संरचित निष्कर्षण — पहचानकर्ता, तिथियाँ, टर्नओवर और स्थानीय-सामग्री आँकड़े।",
      },
      {
        title: "Network Relational Graphing",
        meta: "कार्टेल जाँच",
        body: "NetworkX ग्राफ़ इंजन उन बिडरों के बीच मिलीभगत चिह्नित करता है जो Director Identification Number, पंजीकृत पता या बैंक खाता साझा करते हैं।",
      },
      {
        title: "Error Level Analysis",
        meta: "छवि फोरेंसिक",
        body: "OpenCV-आधारित ELA हीटमैप तुलन-पत्र, टर्नओवर प्रमाणपत्र और वैधानिक मुहरों पर डिजिटल रूप से बदले गए आँकड़ों को उजागर करते हैं।",
      },
      {
        title: "Dynamic Policy Routing",
        meta: "मेक इन इंडिया",
        body: "प्रत्येक बिडर के नियम-समुच्चय पर MII स्थानीय-सामग्री सीमाएँ, MSE आदेश 2012 की छूट और Startup छूट स्वतः लागू करता है।",
      },
      {
        title: "Sandbox API Integration",
        meta: "GSTIN / PAN",
        body: "हर पहचानकर्ता का Udyam, GSTN, PAN, MCA21 और EPFO सैंडबॉक्स से मिलान — ऐसे अनुबंध जो लाइव KYC-एग्रीगेटर API की नकल करते हैं।",
      },
      {
        title: "Zero Black-Box Auditing",
        meta: "क्लिक-टू-सोर्स",
        body: "हर फ़्लैग और स्कोर मूल दस्तावेज़ की ठीक उसी हाइलाइट की गई पंक्ति से जुड़ता है, ताकि अधिकारी अभिलेख पर मूल्यांकन का बचाव कर सके।",
      },
    ],
  },

  finalCta: {
    heading: "पूरा बिडर सत्यापन, आद्योपांत देखें",
    sub: "डेमो अधिकारी खाते से साइन इन करें और किसी निविदा को अनुपालन स्कोरिंग, जालसाज़ी फ़्लैग, कार्टेल ग्राफ़, क्लिक-टू-सोर्स साक्ष्य और अंकेक्षण अभिलेख से गुज़ारें।",
    primary: "AI ऑडिट डेमो देखें",
    secondary: "खाता बनाएँ",
  },

  footer: {
    address: "गवर्नमेंट ई-मार्केटप्लेस, जीवन तारा भवन, संसद मार्ग, नई दिल्ली – 110001",
    tollFree: "टोल-फ्री 1800-419-3436",
    blurb:
      "एक AI-संचालित एकीकृत बिड अनुपालन सत्यापन मंच जो दस्तावेज़ जालसाज़ी पर शून्य सहिष्णुता लागू करते हुए तकनीकी मूल्यांकन को तेज़ करता है — क्रय अधिकारी के लिए निर्णय-सहायता, कभी भी ब्लैक बॉक्स नहीं।",
    nic: "राष्ट्रीय सूचना विज्ञान केंद्र",
    copyright:
      "© 2026 गवर्नमेंट ई-मार्केटप्लेस। स्मार्ट इंडिया हैकाथॉन (SIH 2026) हेतु टीम HACK-ATHLETE द्वारा डिज़ाइन। GIGW 3.0 अनुरूप।",
    columns: {
      about: {
        title: "GeM के बारे में",
        links: [
          "मंच दृष्टि एवं मिशन",
          "AI बिड अनुपालन अवलोकन",
          "समस्या कथन 26100 (SIH 2026)",
          "समाचार कक्ष एवं प्रेस विज्ञप्तियाँ",
          "GeM में कैरियर",
          "कार्यक्रम कार्यालय से संपर्क करें",
        ],
      },
      policies: {
        title: "नीतियाँ",
        links: [
          "गोपनीयता नीति",
          "उपयोग की शर्तें",
          "मेक-इन-इंडिया (MII) आदेश 2017",
          "सार्वजनिक क्रय (MSE) आदेश 2012",
          "सामान्य वित्तीय नियम (GFR) 2017",
          "GIGW 3.0 सुगम्यता विवरण",
        ],
      },
      help: {
        title: "सहायता एवं प्रशिक्षण",
        links: [
          "सहायता टिकट दर्ज करें",
          "क्रय अधिकारी प्रशिक्षण",
          "विक्रेता ऑनबोर्डिंग मार्गदर्शिका",
          "वीडियो ट्यूटोरियल एवं वेबिनार",
          "अक्सर पूछे जाने वाले प्रश्न",
          "डाउनलोड एवं उपयोगकर्ता पुस्तिकाएँ",
        ],
      },
      links: {
        title: "महत्वपूर्ण लिंक",
        links: [
          "स्टार्टअप इंडिया",
          "डिजिटल इंडिया",
          "मेक इन इंडिया",
          "Udyam पंजीकरण",
          "GST पोर्टल",
          "MCA21 पोर्टल",
          "केंद्रीय सार्वजनिक क्रय पोर्टल",
        ],
      },
    },
  },

  authShell: {
    heading: "AI-संचालित एकीकृत बिड अनुपालन सत्यापन मंच",
    blurb:
      "अधिकारी निविदाएँ विन्यस्त करते हैं, वैधानिक दस्तावेज़ सत्यापित करते हैं और निर्णय दर्ज करते हैं। विक्रेता पंजीकरण करते हैं, बिड तैयार करते हैं और जमा करते हैं। हर क्रिया छेड़छाड़-रोधी अभिलेख में दर्ज होती है।",
    prototype: "SIH 2026 प्रोटोटाइप · समस्या कथन 26100",
  },

  login: {
    title: "साइन इन करें",
    subtitle: "जारी रखने के लिए अपनी लॉगिन जानकारी दर्ज करें। मंच पर नए हैं?",
    applyNotice: "इस बिड में भाग लेने के लिए साइन इन करें। हम आपको सीधे इसकी अपलोड स्क्रीन पर ले जाएँगे।",
    email: "ईमेल",
    password: "पासवर्ड",
    signingIn: "साइन इन हो रहा है…",
    orWithEmail: "या ईमेल से",
    continueGoogle: "Google से जारी रखें",
    connecting: "कनेक्ट हो रहा है…",
    demoAccounts: "डेमो खाते · पासवर्ड Demo@12345",
    roles: {
      officer: "क्रय अधिकारी",
      apollo: "विक्रेता — Apollo Technologies",
      greenfield: "विक्रेता — Greenfield Traders",
    },
    goes: {
      console: "सत्यापन कंसोल",
      portal: "बिडर पोर्टल",
    },
  },

  register: {
    title: "अपना खाता बनाएँ",
    already: "पहले से पंजीकृत हैं?",
    creatingVendor: "पंजीकरण एवं MPIN जारी हो रहा है…",
    creatingOfficer: "खाता बनाया जा रहा है…",
    submitVendor: "पंजीकरण करें और MPIN पाएँ",
    submitOfficer: "खाता बनाएँ",
    roleVendor: "विक्रेता / बिडर",
    roleOfficer: "क्रय अधिकारी",
    sections: {
      account: "खाता",
      entity: "इकाई विवरण",
      statutory: "वैधानिक पहचानकर्ता",
      msme: "MSME / Startup",
      financials: "वित्तीय एवं अनुपालन",
      director: "अधिकृत निदेशक / हस्ताक्षरकर्ता",
    },
    fields: {
      legalName: "इकाई का पंजीकृत / विधिक नाम",
      fullName: "पूरा नाम",
      workEmail: "कार्यालय ईमेल",
      govEmail: "सरकारी ईमेल",
      password: "पासवर्ड",
      confirm: "पासवर्ड की पुष्टि करें",
      constitution: "गठन",
      cin: "CIN / LLPIN",
      cinHint: "(यदि निगमित हो)",
      address: "पंजीकृत पता",
      addressPlaceholder: "भवन, सड़क, शहर, PIN",
      state: "राज्य / केंद्र शासित प्रदेश",
      sector: "प्राथमिक क्षेत्र",
      optional: "(वैकल्पिक)",
      pan: "PAN",
      gstin: "GSTIN",
      aadhaar: "अधिकृत हस्ताक्षरकर्ता का आधार",
      aadhaarHint: "(वैकल्पिक · मास्क करके संग्रहीत)",
      aadhaarPlaceholder: "12-अंकीय आधार",
      msmeQuestion: "क्या इकाई MSME (Udyam) के रूप में पंजीकृत है?",
      msmeNo: "नहीं",
      msmeYes: "हाँ — Udyam पंजीकृत",
      udyam: "Udyam पंजीकरण संख्या",
      msmeClass: "MSME श्रेणी",
      turnover: "पिछले वित्त वर्ष का टर्नओवर (₹ करोड़)",
      caUdin: "टर्नओवर विवरण पर CA UDIN",
      mii: "मेक-इन-इंडिया स्थानीय सामग्री (%)",
      directorName: "निदेशक का नाम",
      directorNamePlaceholder: "MCA अभिलेख के अनुसार",
      directorDin: "निदेशक DIN",
      dinPlaceholder: "8-अंकीय DIN",
      select: "चुनें…",
    },
    mpinNotice:
      "जमा करने पर आपका विवरण राष्ट्रीय बिडर रजिस्ट्री में दर्ज होता है और आपको एक अद्वितीय 6-अंकीय MPIN जारी किया जाता है। किसी भी निविदा में प्रवेश हेतु MPIN आवश्यक है, इसलिए दिखने पर इसे सहेज लें।",
    terms:
      "पंजीकरण करके आप पुष्टि करते हैं कि दी गई जानकारी सही है और मंच की उपयोग शर्तों से सहमत हैं। यह एक प्रोटोटाइप वातावरण है।",
  },

  mpin: {
    title: "आपका MPIN",
    intro: "अब राष्ट्रीय बिडर रजिस्ट्री में है",
    introAs: "इस रूप में",
    introTail: "यह 6-अंकीय MPIN हर निविदा हेतु आपकी हस्ताक्षर कुंजी है — यह केवल एक बार दिखाया जाता है।",
    label: "आपका MPIN",
    copy: "कॉपी करें",
    copied: "कॉपी हो गया",
    warning:
      "इसे अभी लिख लें। सुरक्षा हेतु यह दोबारा पूर्ण रूप में नहीं दिखाया जाता — बाद में आप इसे केवल अपनी प्रोफ़ाइल से, खाता पासवर्ड पुनः दर्ज करने के बाद देख सकते हैं।",
    ack: "मैंने अपना MPIN सुरक्षित स्थान पर सहेज लिया है।",
    continue: "पोर्टल पर जाएँ",
    continuing: "जारी है…",
  },

  tenders: {
    title: "चालू निविदाएँ",
    subtitle:
      "केंद्रीय मंत्रालयों एवं विभागों में लाइव बिड अवसर। ब्राउज़िंग सभी के लिए खुली है — भाग लेने हेतु ही साइन इन आवश्यक है।",
    infoBanner:
      "भाग लें चुनने पर आपकी इकाई का PAN या GSTIN से GeM रजिस्ट्री के विरुद्ध सत्यापन होता है। सत्यापित इकाइयाँ सीधे आवेदन पर जाती हैं; नई इकाइयाँ त्वरित ऑनबोर्डिंग विज़ार्ड पर भेजी जाती हैं।",
    searchPlaceholder: "वस्तु या GeM बिड संख्या से खोजें…",
    ministry: "मंत्रालय",
    allMinistries: "सभी मंत्रालय",
    sort: "क्रमबद्ध करें",
    sortEndAsc: "जल्दी बंद होने वाली",
    sortEndDesc: "देर से बंद होने वाली",
    sortValueDesc: "सर्वाधिक मूल्य",
    showing: "दिखा रहे हैं",
    of: "में से",
    bids: "बिड",
    participate: "भाग लें",
    mseExempt: "MSE / EMD छूट",
    daysLeft: "दिन शेष",
    dayLeft: "दिन शेष",
    closed: "बंद",
    noResults: "आपके फ़िल्टर से कोई चालू बिड मेल नहीं खाती।",
    cols: {
      bidNo: "GeM बिड सं.",
      item: "वस्तु / श्रेणी",
      ministry: "मंत्रालय / विभाग",
      quantity: "मात्रा",
      endDate: "बिड समाप्ति तिथि",
      action: "कार्रवाई",
    },
  },
};

export const dictionaries: Record<Locale, Dict> = { en, hi };
