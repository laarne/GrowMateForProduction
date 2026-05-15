import React, { useMemo, useState } from "react";
import {
  Award,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Heart,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

const plantPhotos = {
  monstera:
    "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=80",
  calathea:
    "https://images.unsplash.com/photo-1620803366004-119b57f54cd6?auto=format&fit=crop&w=900&q=80",
  pothos:
    "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?auto=format&fit=crop&w=900&q=80",
  anthurium:
    "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=900&q=80",
  cactus:
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=900&q=80",
  fern:
    "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=900&q=80",
  herb:
    "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=900&q=80",
  snake:
    "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&w=900&q=80",
  orchid:
    "https://images.unsplash.com/photo-1566907225475-3a1c8b8e95c8?auto=format&fit=crop&w=900&q=80",
  bonsai:
    "https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80",
  fiddle:
    "https://images.unsplash.com/photo-1597055181300-e3633a917c24?auto=format&fit=crop&w=900&q=80",
  hoya:
    "https://images.unsplash.com/photo-1616500156884-a44d174db6a6?auto=format&fit=crop&w=900&q=80",
  succulent:
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
  alocasia:
    "https://images.unsplash.com/photo-1604762512526-b706f14042e3?auto=format&fit=crop&w=900&q=80",
  peperomia:
    "https://images.unsplash.com/photo-1620127682229-33388276e540?auto=format&fit=crop&w=900&q=80",
};

const collection = [
  {
    id: 1,
    name: "Monstera Thai Constellation",
    nickname: "Nova",
    image: plantPhotos.monstera,
    status: "Thriving",
    tag: "Rare",
    availability: "Cuttings soon",
    likes: 284,
    age: "1y 8m",
    updates: ["New fenestrated leaf opened", "Repotted into chunky aroid mix", "Moss pole extended"],
  },
  {
    id: 2,
    name: "Calathea Orbifolia",
    nickname: "Luna",
    image: plantPhotos.calathea,
    status: "Recovering",
    tag: "Pet friendly",
    availability: "Not available",
    likes: 143,
    age: "9m",
    updates: ["Humidity tray added", "Brown edges trimmed", "Moved away from afternoon sun"],
  },
  {
    id: 3,
    name: "Golden Pothos",
    nickname: "Milo",
    image: plantPhotos.pothos,
    status: "Propagating",
    tag: "Easy care",
    availability: "Open to trade",
    likes: 96,
    age: "2y",
    updates: ["Five nodes rooted", "Two cuttings ready", "Trailing shelf reset"],
  },
  {
    id: 4,
    name: "Anthurium Clarinervium",
    nickname: "Velvet",
    image: plantPhotos.anthurium,
    status: "Flowering",
    tag: "Collector",
    availability: "Wishlist only",
    likes: 219,
    age: "1y 2m",
    updates: ["First inflorescence spotted", "Leaf shine cleaned", "Switched to filtered water"],
  },
  {
    id: 5,
    name: "Snake Plant Laurentii",
    nickname: "Scout",
    image: plantPhotos.snake,
    status: "Thriving",
    tag: "Low light",
    availability: "Pups available",
    likes: 88,
    age: "3y",
    updates: ["Two pups emerged", "Moved to brighter corner", "Soil fully dried between watering"],
  },
  {
    id: 6,
    name: "Mini Phalaenopsis Orchid",
    nickname: "Pearl",
    image: plantPhotos.orchid,
    status: "Flowering",
    tag: "Blooming",
    availability: "Not available",
    likes: 176,
    age: "7m",
    updates: ["Second bloom spike opened", "Root tips are active", "Bark mix refreshed"],
  },
  {
    id: 7,
    name: "Fiddle Leaf Fig",
    nickname: "Atlas",
    image: plantPhotos.fiddle,
    status: "Growing",
    tag: "Statement",
    availability: "Not available",
    likes: 132,
    age: "2y 4m",
    updates: ["Rotated for even growth", "New top leaf hardened", "Dust cleaned from leaves"],
  },
  {
    id: 8,
    name: "Hoya Carnosa Compacta",
    nickname: "Rope",
    image: plantPhotos.hoya,
    status: "Propagating",
    tag: "Trailing",
    availability: "Open to trade",
    likes: 201,
    age: "1y 5m",
    updates: ["Cutting callused", "Peduncle spotted", "Moved near morning light"],
  },
  {
    id: 9,
    name: "Alocasia Frydek",
    nickname: "Emerald",
    image: plantPhotos.alocasia,
    status: "Recovering",
    tag: "Velvet",
    availability: "Wishlist only",
    likes: 157,
    age: "11m",
    updates: ["Humidity increased", "Old leaf removed", "New spear visible"],
  },
  {
    id: 10,
    name: "Peperomia Watermelon",
    nickname: "Melon",
    image: plantPhotos.peperomia,
    status: "Thriving",
    tag: "Compact",
    availability: "Leaf cuttings soon",
    likes: 119,
    age: "10m",
    updates: ["Three new leaves", "Self-watering pot tested", "Moved to shelf level two"],
  },
];

const marketPlants = [
  ["Silver Sword Philodendron", "PHP 2,100", "Quezon City", "Sell", plantPhotos.fern],
  ["Rooted Cebu Blue Cutting", "PHP 650", "Makati", "Trade", plantPhotos.pothos],
  ["Desert Cactus Trio", "PHP 1,250", "Pasig", "Sell", plantPhotos.cactus],
  ["Kitchen Herb Starter Set", "PHP 980", "Taguig", "Sell", plantPhotos.herb],
  ["Snake Plant Pup", "PHP 420", "Marikina", "Trade", plantPhotos.snake],
  ["Mini Orchid in Bloom", "PHP 1,850", "San Juan", "Sell", plantPhotos.orchid],
  ["Hoya Carnosa Cutting", "PHP 700", "Mandaluyong", "Trade", plantPhotos.hoya],
  ["Watermelon Peperomia", "PHP 950", "Pasay", "Sell", plantPhotos.peperomia],
];

const trades = [
  ["Maya Cruz", "Wants Golden Pothos cuttings", "Offering: Hoya carnosa rooted cutting", "92% match"],
  ["Jun Park", "Asked about Monstera nodes", "Offering: cash or rare soil mix", "78% match"],
  ["Nina Santos", "Wishlist match found", "Offering: Philodendron micans", "85% match"],
];

const communityGardens = [
  {
    id: "maya",
    owner: "Maya Cruz",
    name: "Balcony Jungle",
    location: "Mandaluyong",
    cover: plantPhotos.calathea,
    score: "9.8k",
    followers: "1.4k",
    rank: "#1",
    bio: "Rare foliage, humid balcony shelves, and weekly growth updates.",
    badges: ["Most admired", "Rare collector", "Top trader"],
    plants: [
      { name: "Philodendron Gloriosum", image: plantPhotos.fern, tag: "Rare" },
      { name: "Calathea Orbifolia", image: plantPhotos.calathea, tag: "Humidity" },
      { name: "Hoya Carnosa", image: plantPhotos.hoya, tag: "Cuttings" },
    ],
  },
  {
    id: "sofia",
    owner: "Sofia Reyes",
    name: "Herb Roof",
    location: "Taguig",
    cover: plantPhotos.herb,
    score: "8.7k",
    followers: "940",
    rank: "#3",
    bio: "Edible balcony garden with basil, mint, chili, and weekend harvest logs.",
    badges: ["Harvest streak", "Community helper", "Beginner friendly"],
    plants: [
      { name: "Sweet Basil", image: plantPhotos.herb, tag: "Harvest" },
      { name: "Mini Cactus Trio", image: plantPhotos.cactus, tag: "Sunny" },
      { name: "Golden Pothos", image: plantPhotos.pothos, tag: "Trade" },
    ],
  },
  {
    id: "jun",
    owner: "Jun Park",
    name: "Bonsai Courtyard",
    location: "Pasig",
    cover: plantPhotos.bonsai,
    score: "8.4k",
    followers: "812",
    rank: "#5",
    bio: "Slow-growing bonsai collection, shape updates, and local swap meetups.",
    badges: ["Trusted trader", "Care streak", "Slow grower"],
    plants: [
      { name: "Juniper Bonsai", image: plantPhotos.bonsai, tag: "Showcase" },
      { name: "Snake Plant", image: plantPhotos.snake, tag: "Low light" },
      { name: "Peperomia", image: plantPhotos.peperomia, tag: "Compact" },
    ],
  },
];

const leaderboard = {
  Gardens: [
    ["Maya", "Balcony Jungle", 9840, "142 admirers"],
    ["Lyxter", "Aroid Shelf Lab", 9120, "38 updates"],
    ["Sofia", "Herb Roof", 8730, "21 harvests"],
  ],
  Traders: [
    ["Jun", "Trusted Trader", 7620, "54 clean trades"],
    ["Maya", "Cutting Queen", 7210, "4.9 rating"],
    ["Paolo", "Weekend Swapper", 6840, "fast replies"],
  ],
  Helpers: [
    ["Nina", "Plant Doctor", 6420, "89 care answers"],
    ["Lyxter", "ID Specialist", 6185, "47 IDs solved"],
    ["Sam", "Pest Rescue", 5900, "32 saves"],
  ],
};

const tabs = [
  [Home, "Home"],
  [ShoppingBag, "Market"],
  [Leaf, "Garden"],
  [Send, "Trade"],
  [Trophy, "Rank"],
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ children, tone = "green" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold ring-1", tones[tone])}>{children}</span>;
}

function PhoneShell({ children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#f5f8ef] shadow-[0_28px_90px_rgba(37,61,41,0.24)] sm:my-6 sm:min-h-[880px] sm:rounded-[2.4rem] sm:border-[10px] sm:border-[#1e2a20]">
      <div className="hidden h-6 items-center justify-center bg-[#1e2a20] sm:flex">
        <span className="h-1.5 w-20 rounded-full bg-white/25" />
      </div>
      {children}
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between px-5 pb-3 pt-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#23422a] text-[#d9f99d]">
            <Sprout size={20} />
          </span>
          <p className="text-2xl font-black tracking-tight text-[#203522]">growMate</p>
        </div>
        <p className="mt-1 text-sm font-medium text-[#73806c]">Buy, trade, and grow together.</p>
      </div>
      <button className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#203522] shadow-sm">
        <Bell size={19} />
        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#f97316] ring-2 ring-white" />
      </button>
    </header>
  );
}

function HomeView({ setActiveTab }) {
  return (
    <div className="space-y-5 px-5 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#203522] p-5 text-white">
        <img src={plantPhotos.monstera} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative">
          <StatusPill tone="amber">Garden level 18</StatusPill>
          <h1 className="mt-16 max-w-64 text-3xl font-black leading-none tracking-tight">Your garden is trending this week.</h1>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setActiveTab("Garden")} className="rounded-full bg-[#d9f99d] px-4 py-2 text-sm font-bold text-[#203522]">
              View garden
            </button>
            <button onClick={() => setActiveTab("Market")} className="rounded-full bg-white/18 px-4 py-2 text-sm font-bold backdrop-blur">
              Browse plants
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          ["42", "Plants"],
          ["18", "Trades"],
          ["9.1k", "Score"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#203522]">{value}</p>
            <p className="mt-1 text-xs font-bold text-[#7a8572]">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#203522]">Today in your garden</h2>
          <Sparkles size={18} className="text-[#f97316]" />
        </div>
        <div className="space-y-3">
          {[
            ["Water check", "3 plants due today", Check],
            ["New admirer", "Maya saved your Monstera", Heart],
            ["Trade match", "Golden Pothos matches Nina's wishlist", Send],
          ].map(([title, detail, Icon]) => (
            <button key={title} className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf7dc] text-[#315d37]">
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-[#203522]">{title}</span>
                <span className="block text-sm text-[#73806c]">{detail}</span>
              </span>
              <ChevronRight size={18} className="text-[#9aa690]" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MarketView() {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? marketPlants : marketPlants.filter((item) => item[3] === filter);

  return (
    <div className="px-5 pb-24">
      <div className="sticky top-0 z-10 -mx-5 bg-[#f5f8ef]/90 px-5 pb-3 pt-1 backdrop-blur">
        <div className="flex items-center gap-2 rounded-3xl bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="text-[#89947f]" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-[#89947f]" placeholder="Search monstera, cactus, cuttings..." />
        </div>
        <div className="mt-3 flex gap-2">
          {["All", "Sell", "Trade"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                filter === item ? "bg-[#203522] text-white" : "bg-white text-[#63705e]"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {shown.map(([name, price, location, type, image]) => (
          <article key={name} className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm">
            <img src={image} alt={name} className="h-36 w-full object-cover" />
            <div className="p-3">
              <StatusPill tone={type === "Trade" ? "blue" : "green"}>{type}</StatusPill>
              <h3 className="mt-2 min-h-10 text-sm font-black leading-tight text-[#203522]">{name}</h3>
              <p className="mt-2 text-lg font-black text-[#315d37]">{price}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#7a8572]">
                <MapPin size={12} /> {location}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function GardenModeSwitch({ gardenMode, setGardenMode, setSelectedGarden }) {
  return (
    <div className="mb-4 flex gap-2 px-5">
      {["Mine", "Visit"].map((mode) => (
        <button
          key={mode}
          onClick={() => {
            setGardenMode(mode);
            setSelectedGarden(null);
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-black transition",
            gardenMode === mode ? "bg-[#203522] text-white" : "bg-white text-[#63705e]"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function VisitGardensView({ selectedGarden, setSelectedGarden }) {
  if (selectedGarden) {
    return (
      <div className="px-5 pb-24">
        <button
          onClick={() => setSelectedGarden(null)}
          className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#63705e] shadow-sm"
        >
          <ArrowLeft size={16} /> Gardens
        </button>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="relative h-52">
            <img src={selectedGarden.cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-white/75">{selectedGarden.owner}</p>
              <h2 className="mt-1 text-3xl font-black leading-none">{selectedGarden.name}</h2>
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-white/85">
                <MapPin size={14} /> {selectedGarden.location}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#edf1e8] p-4 text-center">
            {[
              [selectedGarden.score, "Score"],
              [selectedGarden.followers, "Followers"],
              [selectedGarden.rank, "Rank"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-black text-[#203522]">{value}</p>
                <p className="text-[11px] font-bold text-[#7a8572]">{label}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#edf1e8] p-4">
            <p className="text-sm font-semibold leading-6 text-[#63705e]">{selectedGarden.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedGarden.badges.map((badge) => (
                <StatusPill key={badge} tone="amber">{badge}</StatusPill>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-full bg-[#203522] px-4 py-3 text-sm font-black text-white">Follow garden</button>
              <button className="rounded-full bg-[#edf7dc] px-4 py-3 text-sm font-black text-[#315d37]">Message</button>
            </div>
          </div>
        </section>

        <h3 className="mt-5 text-lg font-black text-[#203522]">Garden plants</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {selectedGarden.plants.map((plant) => (
            <article key={plant.name} className="overflow-hidden rounded-[1.3rem] bg-white shadow-sm">
              <img src={plant.image} alt={plant.name} className="h-24 w-full object-cover" />
              <div className="p-2">
                <p className="line-clamp-2 min-h-9 text-xs font-black leading-tight text-[#203522]">{plant.name}</p>
                <p className="mt-1 text-[11px] font-bold text-[#7a8572]">{plant.tag}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-24">
      {communityGardens.map((garden) => (
        <button
          key={garden.id}
          onClick={() => setSelectedGarden(garden)}
          className="w-full overflow-hidden rounded-[1.8rem] bg-white text-left shadow-sm"
        >
          <div className="relative h-36">
            <img src={garden.cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/75">{garden.owner}</p>
              <p className="text-2xl font-black">{garden.name}</p>
            </div>
            <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#203522]">
              {garden.rank}
            </span>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold leading-6 text-[#63705e]">{garden.bio}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-black text-[#315d37]">{garden.score} garden score</span>
              <span className="inline-flex items-center gap-1 text-xs font-black text-[#7a8572]">
                Visit <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function GardenView() {
  const [selectedPlant, setSelectedPlant] = useState(collection[0]);
  const [gardenMode, setGardenMode] = useState("Mine");
  const [selectedGarden, setSelectedGarden] = useState(null);

  if (gardenMode === "Visit") {
    return (
      <>
        <GardenModeSwitch gardenMode={gardenMode} setGardenMode={setGardenMode} setSelectedGarden={setSelectedGarden} />
        <VisitGardensView selectedGarden={selectedGarden} setSelectedGarden={setSelectedGarden} />
      </>
    );
  }

  return (
    <div className="px-5 pb-24">
      <div className="-mx-5">
        <GardenModeSwitch gardenMode={gardenMode} setGardenMode={setGardenMode} setSelectedGarden={setSelectedGarden} />
      </div>
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="relative h-44">
          <img src={plantPhotos.fern} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#203522]">
            <Camera size={18} />
          </button>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-2xl font-black">Lyxter's Aroid Shelf Lab</p>
            <p className="mt-1 text-sm font-semibold text-white/85">42 plants · 6 open to trade · Rank #2</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#edf1e8] p-4 text-center">
          {[
            ["9.1k", "Garden score"],
            ["284", "Top likes"],
            ["38", "Updates"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-black text-[#203522]">{value}</p>
              <p className="text-[11px] font-bold text-[#7a8572]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-lg font-black text-[#203522]">Plant collection</h2>
        <button className="inline-flex items-center gap-1 rounded-full bg-[#203522] px-3 py-2 text-xs font-bold text-white">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {collection.map((plant) => (
          <button
            key={plant.id}
            onClick={() => setSelectedPlant(plant)}
            className={cn(
              "overflow-hidden rounded-[1.5rem] bg-white text-left shadow-sm ring-2 transition",
              selectedPlant.id === plant.id ? "ring-[#8bc34a]" : "ring-transparent"
            )}
          >
            <img src={plant.image} alt={plant.name} className="h-32 w-full object-cover" />
            <div className="p-3">
              <p className="text-xs font-bold text-[#7a8572]">{plant.nickname}</p>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-tight text-[#203522]">{plant.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <StatusPill tone={plant.status === "Recovering" ? "amber" : "green"}>{plant.status}</StatusPill>
                <span className="flex items-center gap-1 text-xs font-bold text-[#7a8572]">
                  <Heart size={13} /> {plant.likes}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <section key={selectedPlant.id} className="mt-5 rounded-[1.7rem] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <img src={selectedPlant.image} alt="" className="h-20 w-20 rounded-3xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-black leading-tight text-[#203522]">{selectedPlant.name}</p>
              <p className="mt-1 text-sm font-semibold text-[#73806c]">
                {selectedPlant.nickname} · {selectedPlant.age} · {selectedPlant.availability}
              </p>
              <div className="mt-2 flex gap-2">
                <StatusPill>{selectedPlant.tag}</StatusPill>
                <StatusPill tone="blue">{selectedPlant.status}</StatusPill>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {selectedPlant.updates.map((update, index) => (
              <div key={update} className="flex gap-3">
                <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf7dc] text-xs font-black text-[#315d37]">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-[#63705e]">{update}</p>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}

function TradeView() {
  return (
    <div className="space-y-4 px-5 pb-24">
      <section className="rounded-[2rem] bg-[#203522] p-5 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#d9f99d]" />
          <p className="font-black">Trade trust score</p>
        </div>
        <p className="mt-5 text-5xl font-black">4.9</p>
        <p className="mt-1 text-sm font-semibold text-white/75">18 completed trades · no disputes · fast responder</p>
      </section>

      <h2 className="text-lg font-black text-[#203522]">Trade requests</h2>
      {trades.map(([name, title, detail, match]) => (
        <article key={title} className="rounded-[1.6rem] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#edf7dc] text-[#315d37]">
              <UserRound size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-[#203522]">{name}</p>
                <StatusPill tone="blue">{match}</StatusPill>
              </div>
              <p className="mt-1 text-sm font-bold text-[#315d37]">{title}</p>
              <p className="mt-1 text-sm text-[#73806c]">{detail}</p>
              <div className="mt-4 flex gap-2">
                <button className="rounded-full bg-[#203522] px-4 py-2 text-xs font-bold text-white">Accept</button>
                <button className="rounded-full bg-[#f0f4e8] px-4 py-2 text-xs font-bold text-[#63705e]">Message</button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function RankView() {
  const [board, setBoard] = useState("Gardens");
  const rows = leaderboard[board];

  return (
    <div className="px-5 pb-24">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8bc34a]">This month</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#203522]">Leaderboard</h1>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-[#fff4db] text-[#f97316]">
            <Award size={26} />
          </span>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#73806c]">
          Ranking rewards garden activity, admired collections, clean trades, and helpful community answers.
        </p>
      </section>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {Object.keys(leaderboard).map((item) => (
          <button
            key={item}
            onClick={() => setBoard(item)}
            className={cn(
              "min-w-max rounded-full px-4 py-2 text-sm font-bold transition",
              board === item ? "bg-[#203522] text-white" : "bg-white text-[#63705e]"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map(([name, title, score, detail], index) => (
          <article key={name} className="flex items-center gap-3 rounded-[1.6rem] bg-white p-4 shadow-sm">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-black", index === 0 ? "bg-[#fff4db] text-[#f97316]" : "bg-[#edf7dc] text-[#315d37]")}>
              #{index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[#203522]">{name}</p>
              <p className="text-sm font-semibold text-[#73806c]">{title} · {detail}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-[#203522]">{score.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-[#8a967f]">pts</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="z-30 grid w-full shrink-0 grid-cols-5 gap-1 border-t border-[#e3eadb] bg-white/95 px-3 pb-3 pt-2 backdrop-blur sm:rounded-b-[1.75rem]">
      {tabs.map(([Icon, label]) => (
        <button
          key={label}
          onClick={() => setActiveTab(label)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-black transition",
            activeTab === label ? "bg-[#203522] text-white" : "text-[#7d8974]"
          )}
        >
          <Icon size={19} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export default function ProductApp() {
  const [activeTab, setActiveTab] = useState("Garden");

  const title = useMemo(() => {
    if (activeTab === "Garden") return "My Garden";
    if (activeTab === "Rank") return "Leaderboard";
    return activeTab;
  }, [activeTab]);

  const view = {
    Home: <HomeView setActiveTab={setActiveTab} />,
    Market: <MarketView />,
    Garden: <GardenView />,
    Trade: <TradeView />,
    Rank: <RankView />,
  }[activeTab];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,249,157,0.34),transparent_28%),linear-gradient(135deg,#e8f0df,#f7faf1_45%,#dbe8d1)] font-sans text-[#203522]">
      <PhoneShell>
        <div className="flex-1 overflow-y-auto">
          <TopBar />
          {activeTab !== "Home" && (
            <div className="mb-4 flex items-center justify-between px-5">
              <h1 className="text-3xl font-black tracking-tight text-[#203522]">{title}</h1>
              <div className="flex items-center gap-2">
                <button className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#203522] shadow-sm">
                  <Users size={18} />
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#203522] shadow-sm">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          )}
          <div key={activeTab}>{view}</div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </PhoneShell>
    </main>
  );
}
