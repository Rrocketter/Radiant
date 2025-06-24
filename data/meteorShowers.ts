import { MeteorShower } from "../types/meteorShower";

export const METEOR_SHOWERS_2025: MeteorShower[] = [
  {
    id: "quadrantids",
    name: "Quadrantids",
    radiant: "Boötes",
    active: {
      start: "2025-01-01",
      end: "2025-01-05",
    },
    peak: {
      date: "2025-01-03",
      time: "14:30",
    },
    zhr: 80,
    velocity: 41,
    parent: "2003 EH1",
    description:
      "Known for bright fireball meteors and a sharp peak lasting only a few hours.",
    bestViewingTime: "After midnight until dawn",
    radiantPosition: {
      ra: 230,
      dec: 49,
    },
    visibility: {
      hemisphere: "northern",
      monthsVisible: [1],
    },
    difficulty: "moderate",
    moonPhaseImpact: "medium",
  },
  {
    id: "lyrids",
    name: "Lyrids",
    radiant: "Lyra",
    active: {
      start: "2025-04-16",
      end: "2025-04-30",
    },
    peak: {
      date: "2025-04-22",
      time: "09:00",
    },
    zhr: 18,
    velocity: 49,
    parent: "C/1861 G1 Thatcher",
    description:
      "One of the oldest recorded meteor showers, occasionally producing bright fireballs.",
    bestViewingTime: "Late evening to dawn",
    radiantPosition: {
      ra: 271,
      dec: 34,
    },
    visibility: {
      hemisphere: "both",
      monthsVisible: [4],
    },
    difficulty: "easy",
    moonPhaseImpact: "low",
  },
  {
    id: "perseids",
    name: "Perseids",
    radiant: "Perseus",
    active: {
      start: "2025-07-17",
      end: "2025-08-24",
    },
    peak: {
      date: "2025-08-12",
      time: "21:00",
    },
    zhr: 60,
    velocity: 59,
    parent: "109P/Swift-Tuttle",
    description:
      "Most popular meteor shower of the year, known for fast, bright meteors.",
    bestViewingTime: "10 PM to dawn",
    radiantPosition: {
      ra: 46,
      dec: 58,
    },
    visibility: {
      hemisphere: "northern",
      monthsVisible: [7, 8],
    },
    difficulty: "easy",
    moonPhaseImpact: "low",
  },
  {
    id: "orionids",
    name: "Orionids",
    radiant: "Orion",
    active: {
      start: "2025-10-02",
      end: "2025-11-07",
    },
    peak: {
      date: "2025-10-21",
      time: "02:00",
    },
    zhr: 25,
    velocity: 66,
    parent: "1P/Halley",
    description:
      "Fast meteors from Halley's Comet debris, often leaving glowing trains.",
    bestViewingTime: "After midnight until dawn",
    radiantPosition: {
      ra: 95,
      dec: 16,
    },
    visibility: {
      hemisphere: "both",
      monthsVisible: [10, 11],
    },
    difficulty: "easy",
    moonPhaseImpact: "medium",
  },
  {
    id: "leonids",
    name: "Leonids",
    radiant: "Leo",
    active: {
      start: "2025-11-06",
      end: "2025-11-30",
    },
    peak: {
      date: "2025-11-17",
      time: "05:00",
    },
    zhr: 15,
    velocity: 71,
    parent: "55P/Tempel-Tuttle",
    description:
      "Fast meteors that can produce spectacular meteor storms every 33 years.",
    bestViewingTime: "After midnight until dawn",
    radiantPosition: {
      ra: 152,
      dec: 22,
    },
    visibility: {
      hemisphere: "both",
      monthsVisible: [11],
    },
    difficulty: "moderate",
    moonPhaseImpact: "high",
  },
  {
    id: "geminids",
    name: "Geminids",
    radiant: "Gemini",
    active: {
      start: "2025-12-04",
      end: "2025-12-20",
    },
    peak: {
      date: "2025-12-14",
      time: "01:00",
    },
    zhr: 120,
    velocity: 35,
    parent: "3200 Phaethon",
    description:
      "Most prolific meteor shower, producing bright, colorful meteors all night long.",
    bestViewingTime: "All night, best after 9 PM",
    radiantPosition: {
      ra: 112,
      dec: 33,
    },
    visibility: {
      hemisphere: "both",
      monthsVisible: [12],
    },
    difficulty: "easy",
    moonPhaseImpact: "low",
  },
  {
    id: "ursids",
    name: "Ursids",
    radiant: "Ursa Minor",
    active: {
      start: "2025-12-17",
      end: "2025-12-26",
    },
    peak: {
      date: "2025-12-22",
      time: "08:00",
    },
    zhr: 10,
    velocity: 33,
    parent: "8P/Tuttle",
    description:
      "Often overlooked winter shower with modest but consistent activity.",
    bestViewingTime: "All night",
    radiantPosition: {
      ra: 217,
      dec: 76,
    },
    visibility: {
      hemisphere: "northern",
      monthsVisible: [12],
    },
    difficulty: "moderate",
    moonPhaseImpact: "medium",
  },
];

export const getMeteorShowerById = (id: string): MeteorShower | undefined => {
  return METEOR_SHOWERS_2025.find((shower) => shower.id === id);
};

export const getActiveMeteorShowers = (date: Date): MeteorShower[] => {
  const currentDate = date.toISOString().split("T")[0];
  return METEOR_SHOWERS_2025.filter((shower) => {
    return (
      currentDate >= shower.active.start && currentDate <= shower.active.end
    );
  });
};

export const getUpcomingMeteorShowers = (days: number = 30): MeteorShower[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  return METEOR_SHOWERS_2025.filter((shower) => {
    const peakDate = new Date(shower.peak.date);
    return peakDate >= today && peakDate <= futureDate;
  });
};

export const getMajorMeteorShowers = (): MeteorShower[] => {
  return METEOR_SHOWERS_2025.filter((shower) => shower.zhr >= 50);
};
