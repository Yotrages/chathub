import {
  application,
  approval,
  automated,
  blockchain,
  instagram,
  land_registration,
  linkedin,
  map1,
  map2,
  map3,
  map4,
  map5,
  map6,
  ownership,
  twitter,
  whatsapp,
} from "@/public/assets/home";
// import { AdminIcon } from "@/components/shared/admin-icon";
// import { FileIcon } from "@/components/shared/file-icon";
// import { HelpIcon } from "@/components/shared/help-icon";
// import { HomeIcon } from "@/components/shared/home-icon";
// import { LandIcon } from "@/components/shared/land-icon";
// import { SettingsIcon } from "@/components/shared/settings-icon";
// import { UserIcon } from "@/components/shared/user-icon";
import { ayisat, btn_icon_one, david, essien, mary, sandra } from "@/public/assets/admin";

export const tablecheckboxClassNames =
  "!border data-[checked]:!border-transparent !border-grey-300 !rounded-sm";

export const tableMenuDropdownClassNames = {
  dropdown: "!bg-white !shadow-md",
  item: "!px-4 !py-3 hover:!bg-grey-50 !text-grey-900 !text-sm !font-medium",
};

export const DEFAULT_MODAL_SETTINGS = {
  centered: true,
  withCloseButton: false,
  size: "auto",
  styles: {
    content: {
      display: "flex",
      flexDirection: "column" as const,
      background: "none",
    },
    header: {
      margin: 0,
      padding: 0,
    },
    body: {
      margin: 0,
      padding: 0,
      overflow: "auto",
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
    },
  },
};

export const navLinks = [
  {
    name: "About",
    route: "/",
  },
  {
    name: "Projects",
    route: "/land-application",
  },
  {
    name: "Skills",
    route: "/verify-land",
  },
  {
    name: "Contact",
    route: "/land-ownership",
  },
];

export const data = [
  {
    question: "Question people asked us goes here",
    answer: `Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid.
      3 wolf moon officia aute, non cupidatat skateboard dolor brunch...`,
  },
  {
    question: "Question people asked us goes here",
    answer: "Answer content here...",
  },
  {
    question: "Question people asked us goes here",
    answer: "Answer content here...",
  },
];

export const footerLinks = [
  {
    heading: "Quick Links",
    links: ["Features", "FAQs", "Contact"],
  },
  {
    heading: "Company",
    links: ["About Us", "Privacy Policy", "Terms Of Service"],
  },
];

export const steps = [
  {
    title: "Acquisition",
    description:
      "From GPS mapping to land categorization, we help you acquire and manage land effortlessly.",
  },
  {
    title: "Allocation",
    description:
      "Streamline land allocation with transparent application and approval processes.",
  },
  {
    title: "Ownership Tracking",
    description: "Track ownership history securely with blockchain technology.",
  },
];

export const Projects = [
  {
    map: map1,
    location: "Alafia Estate, Ibadan",
    address: "Iwo road",
  },
  {
    map: map2,
    location: "Lakeside Estate, Lagos",
    address: "Ikeja",
  },
  {
    map: map3,
    location: "FCT Modern Market",
    address: "Abuja",
  },
  {
    map: map4,
    location: "Alafia Estate, Ibadan",
    address: "Iwo road",
  },
  {
    map: map5,
    location: "Lakeside Estate, Lagos",
    address: "Ikeja",
  },
  {
    map: map6,
    location: "FCT Modern Market",
    address: "Abuja",
  },
];

export const Feature = [
  {
    title: "Land Registration and Mapping",
    description:
      "Digitally register and map land plots with integrated GPS tools",
    icon: land_registration,
  },
  {
    title: "Blockchain Integration for Land Transfer",
    description: "Ensure secure, immutable ownership records using blockchain.",
    icon: blockchain,
  },
  {
    title: "Annual Ground Rent Automation",
    description: "Automated billing and notifications for lease management",
    icon: automated,
  },
];

export const how_It_Works = [
  {
    heading: "01",
    icon: application,
    title: "Apply Online",
    description: "Start your journey by submitting an easy online application",
  },
  {
    heading: "02",
    icon: approval,
    title: "Get Vetted and Approved",
    description: "Our team reviews your application quickly and transparently",
  },
  {
    heading: "03",
    icon: ownership,
    title: "Secure Ownership",
    description: "Complete the process with the ownership documents",
  },
];

export const socialIcons = [whatsapp, instagram, linkedin, twitter];


export const allocatedPlot = [
  {
    image: sandra,
    name: 'Sandra Tobiloba',
  },
  {
    image: david,
    name: 'David Mathew',
  },
  {
    image: mary,
    name: 'Mary Bolarie',
  },
  {
    image: ayisat,
    name: 'Ayisat Mohammed',
  }
]

export const plotActivity = [
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Applied for plot #2057'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Allocated Plot #2057 in Residential Zone'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Submitted updated coordinates for Plot #1523'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Applied for Plot #2057'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Subdivision request for Plot #1084'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Applied for Plot #2057'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Applied for Plot #2057'
  },
  {
    image: sandra,
    name: 'David Bamiloye',
    desc: 'Applied for Plot #2057'
  },
]

export const annualGroundPayment = [
  {
    image: david
  },
  {
    image: ayisat
  },
  {
    image: mary
  },
  {
    image: essien
  }
]