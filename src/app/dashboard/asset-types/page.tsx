'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Layers,
  Wrench,
  LayoutGrid,
  Armchair,
  Lightbulb,
  Fan,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Search,
  Check,
  Sparkles,
  Zap,
  ArrowLeft,
  ChevronRight,
  Info,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { AssetCategory, Machine, FloorLine } from '@/types/cmms';
import { subscribeMachines } from '@/lib/services/cmmsService';
import { ScanModal } from '@/components/scan/ScanModal';

interface AssetTypeSpec {
  id: string;
  name: string;
  category: AssetCategory;
  subtitle: string;
  application: string;
  models: string[];
  specs: Record<string, string>;
  sop: string[];
  checklist: string[];
  compatibleParts: string[];
}

const ASSET_TYPES_CATALOG: AssetTypeSpec[] = [
  // ==================== 1. MACHINERY TYPES ====================
  {
    id: 'SNLS',
    name: 'Single Needle Lockstitch (SNLS)',
    category: 'MACHINE',
    subtitle: 'Primary Seam Joining & Topstitching Workhorse',
    application:
      'Universal sewing machine used for high-speed straight seaming, placket construction, patch pocket setting, and topstitching across knit & woven apparel.',
    models: ['Juki DDL-8700-7', 'Brother S-7200C', 'Juki DDL-9000C-FMS', 'Jack A4B'],
    specs: {
      'Max Sewing Speed': '5,000 RPM',
      'Motor Drive': 'Direct-Drive Integrated Servo (550W)',
      'Needle System': 'DBx1 / 16x231 (#09 to #18)',
      'Stitch Length': '0 to 5.0 mm (Micrometric dial)',
      'Presser Foot Lift': '5.5 mm by hand, 13 mm by knee/pedal',
      'Lubrication': 'Automatic force-feed impeller pump',
      'Automatic Functions': 'Auto thread trimmer (UTT), auto backtack, wiper',
    },
    sop: [
      'Perform 5-point safety check: needle guard, belt cover, eye guard in position.',
      'Always test tension balance on fabric scrap before starting production bundle.',
      'Do not push fabric manually through feed dog; let the machine advance naturally.',
    ],
    checklist: [
      'Daily: Check oil level sight glass before turning on main power.',
      'Daily: Remove needle plate and clean thread fluff / lint from feed dog teeth.',
      'Weekly: Inspect rotary hook point for needle scratches or burrs.',
      'Monthly: Check bobbin case spring tension using a tension gauge.',
    ],
    compatibleParts: [
      'Organ Needles DBx1 (#14/90)',
      'Rotary Hook Assembly (Hirose / Koban)',
      'Steel Bobbin & Tension Spring',
      'Standard Hinged Presser Foot (P351)',
    ],
  },
  {
    id: 'OVERLOCK',
    name: 'Overlock / Safety Stitch (4 & 5-Thread)',
    category: 'MACHINE',
    subtitle: 'High-Speed Edge Trimming & Seam Reinforcement',
    application:
      'High-velocity edge overedging and simultaneous safety joining on t-shirts, polo side seams, sleeve inseams, and denim outer edges.',
    models: ['Pegasus M900-52', 'Siruba 747K / 757K', 'Juki MO-6814S'],
    specs: {
      'Max Sewing Speed': '7,000 to 7,500 RPM',
      'Differential Feed': '0.7 to 2.0 ratio (stretching or gather control)',
      'Needle System': 'DCx27 (#09 to #16)',
      'Knife Trimming': 'Upper carbide & lower steel shear knives',
      'Overedge Width': '4.0 mm to 6.0 mm',
      'Lubrication': 'Fully sealed automatic circulation',
    },
    sop: [
      'Verify knife sharpness: dull knives cause chewed fabric edges and jammed looper chains.',
      'Ensure thread stands are aligned directly above the thread guides to prevent snarling.',
      'Always use tweezers when threading upper and lower loopers.',
    ],
    checklist: [
      'Shift-wise: Clean lint accumulation inside the looper cover chamber.',
      'Daily: Inspect upper and lower trimming knife gap (must be 0.05 mm max).',
      'Weekly: Check silicone needle cooling reservoir level.',
      'Monthly: Inspect looper timing and needle guard deflection.',
    ],
    compatibleParts: [
      'Organ Needles DCx27 (#11/75)',
      'Overlock Upper Knife (Carbide Tip)',
      'Overlock Lower Shear Blade',
      'Curved Blind Looper & Thread Chain Cutter',
    ],
  },
  {
    id: 'FLATLOCK',
    name: 'Flatlock / Interlock (Coverstitch)',
    category: 'MACHINE',
    subtitle: 'Tubular Cylinder-Bed Elastic Seaming & Hemming',
    application:
      'Bottom hemming, sleeve hems, neckline binding, and flat flatlock joining on sportswear, activewear, and intimate apparel.',
    models: ['Yamato VG2700', 'Pegasus W500', 'Siruba F007K'],
    specs: {
      'Max Sewing Speed': '6,000 RPM',
      'Needle Configuration': '3-Needle 5-Thread (Top & Bottom Coverstitch)',
      'Needle System': 'UY128GAS (#10 to #14)',
      'Bed Type': 'Cylinder bed with drop-down feed mechanism',
      'Trimmer Type': 'Pneumatic thread chain & tape cutter',
    },
    sop: [
      'Ensure pneumatic air supply is stable at 5 to 6 Bar for clean thread chain trimming.',
      'Adjust differential feed to eliminate wavy puckering on stretchy Lycra/spandex hems.',
    ],
    checklist: [
      'Shift-wise: Clean fabric lint buildup under the cylinder bed cover.',
      'Daily: Verify top spreader looper clearance to avoid skipped coverstitches.',
      'Weekly: Inspect pneumatic suction hose for fabric scrap blockages.',
    ],
    compatibleParts: [
      'Organ Needles UY128GAS (#11/75)',
      'Bottom Looper & Top Spreader',
      'Cylinder Bed Needle Plate',
      'Pneumatic Trimmer Blade Set',
    ],
  },
  {
    id: 'BARTACK',
    name: 'Electronic Programmable Bartack',
    category: 'MACHINE',
    subtitle: 'High-Stress Point Structural Reinforcement',
    application:
      'Computerized reinforcing stitches on belt loops, pocket stress corners, zipper lower stops, and bag strap anchor points.',
    models: ['Juki LK-1900BN', 'Brother KE-430FX'],
    specs: {
      'Max Sewing Speed': '3,200 RPM',
      'Sewing Field': '40 mm (X) x 30 mm (Y)',
      'Pattern Storage': '51 standard patterns + 200 custom USB slots',
      'Work Clamp Lift': '14 mm to 17 mm (Pulse motor driven)',
      'Needle System': 'DPx5 (#14 to #21)',
    },
    sop: [
      'Select designated pattern number matching the garment tech-pack specification.',
      'Ensure fabric plies are placed flat under the clamp before pressing foot pedal.',
    ],
    checklist: [
      'Daily: Check thread catching hook and pneumatic wiper stroke.',
      'Weekly: Inspect work clamp rubber knurling for wear.',
      'Monthly: Lubricate needle bar guide rails and linear bearings.',
    ],
    compatibleParts: [
      'Organ Needles DPx5 (#16/100)',
      'Work Clamp Foot Frame',
      'Thread Trimming Moving Knife',
    ],
  },
  {
    id: 'BUTTONHOLE',
    name: 'Computerized Buttonhole Indexer',
    category: 'MACHINE',
    subtitle: 'Precision Keyhole & Straight Shirt Buttonholes',
    application:
      'Electronic sensor-controlled buttonhole cutting and lockstitching on woven formal shirts, polo button plackets, and suits.',
    models: ['Brother HE-800B', 'Juki LBH-1790S'],
    specs: {
      'Max Sewing Speed': '4,200 RPM',
      'Buttonhole Length': '6.4 mm to 31.8 mm (Sensor adjustable)',
      'Cutting Method': 'Electronic multi-cut solenoid knife (no blade swapping)',
      'Tension Control': 'Active digital electronic tension mechanism',
    },
    sop: [
      'Calibrate buttonhole pitch and length against garment sample before production runs.',
      'Ensure fabric is held flat without stretching during clamping cycle.',
    ],
    checklist: [
      'Daily: Test-cut buttonhole on waste placket to verify clean knife slice.',
      'Weekly: Clean fabric lint from lower knife slit and thread sensor optics.',
      'Monthly: Check pulse motor belts and clamp timing sensors.',
    ],
    compatibleParts: ['Buttonhole Knife Blade', 'Active Tension Solenoid', 'Lower Needle Plate Anvil'],
  },
  {
    id: 'FEED_OFF_ARM',
    name: 'Feed-off-the-Arm (FOTA)',
    category: 'MACHINE',
    subtitle: 'Heavy Cylinder Arm Lap Seam Chainstitching',
    application:
      'Tubular denim side-seams, yoke joining, and shirt sleeves using twin or triple needle chainstitch with synchronized rear puller rollers.',
    models: ['Jack MS-335', 'Kansai Special DLR-1508', 'Union Special 35800'],
    specs: {
      'Max Sewing Speed': '3,600 RPM',
      'Cylinder Diameter': 'Small circumference tubular arm (42 mm)',
      'Needle Gauge': '1/4 inch (6.4 mm) twin chainstitch',
      'Rear Puller': 'Synchronized mechanical gear-driven grooved roller',
    },
    sop: [
      'Ensure denim fabric lap folder is clear of loose threads before feeding.',
      'Maintain steady pulling cadence synchronized with rear puller roller.',
    ],
    checklist: [
      'Daily: Check rear puller gear engagement and spring tension.',
      'Weekly: Inspect twin chain loopers for thread fraying burrs.',
      'Monthly: Check oil pump sight flow and grease arm drive gears.',
    ],
    compatibleParts: ['Organ Needles UOx113', 'Chainstitch Loopers', 'Grooved Rear Puller Roller'],
  },

  // ==================== 2. WORK TABLE TYPES ====================
  {
    id: 'TABLE_CUTTING',
    name: 'Fabric Spreading & Cutting Table',
    category: 'TABLE',
    subtitle: 'Air-Flotation Precision Bulk Fabric Cutting Bed',
    application:
      'High-capacity laying and slicing bed for 50-100 ply fabric lays. Air-flotation cushions allow heavy fabric spreads to glide effortlessly to end cutters.',
    models: ['Eastman SpreadMaster-12', 'Oshima AirGlide-Pro', 'Gerber Cutting Bed'],
    specs: {
      'Modular Size': '12ft Length x 6ft Width modular interlocking sections',
      'Top Surface': 'High-pressure anti-static laminated phenolic resin',
      'Blower System': 'Centrifugal air blower motor with one-way ball valves',
      'Load Capacity': '600 kg evenly distributed dynamic load',
      'Side Tracks': 'Machined steel guide rails for end-cutter carriages',
    },
    sop: [
      'Turn on air-flotation blower only when shifting the fabric spread to prevent motor overheating.',
      'Do not strike table surface with sharp metal weights or hammer blades.',
    ],
    checklist: [
      'Daily: Wipe surface with dry microfiber cloth to remove sizing powder.',
      'Weekly: Vacuum air-flotation ball holes to prevent cotton lint clog.',
      'Monthly: Check guide rail alignment and leveler bolts across all joints.',
    ],
    compatibleParts: [
      'Air Flotation Ball Valves',
      'Steel End-Cutter Guide Rail',
      'Heavy-Duty Table Leveling Feet',
    ],
  },
  {
    id: 'TABLE_SEWING',
    name: 'Sewing Workstation Table Stand',
    category: 'TABLE',
    subtitle: 'Vibration-Dampened Production Line Stand',
    application:
      'Standardized operator sewing station stand mounting the sewing head, servo motor, foot pedal linkages, thread stand, and waste chute.',
    models: ['Featherlite StitchDesk-Pro', 'Juki K-Stand Original', 'Brother Industrial Stand'],
    specs: {
      'Top Dimensions': '120 cm x 55 cm x 3.8 cm Birch/Pine Laminated Ply',
      'Understructure': 'Heavy-gauge 2.0 mm tubular steel K-stand',
      'Height Adjust': 'Adjustable 70 cm to 85 cm with dual locking bolts',
      'Integrated Features': 'Embedded 100 cm metric tape rule & sliding accessory drawer',
      'Vibration Rating': 'Dampened rubber foot pads tested to 7,500 RPM',
    },
    sop: [
      'Verify table height matches operator elbow angle (90°) for optimal ergonomics.',
      'Ensure waste fabric chute is directed into under-table collection bag.',
    ],
    checklist: [
      'Weekly: Check table rubber leveler feet for looseness or rocking.',
      'Monthly: Inspect embedded measuring rule for peeling or worn numbers.',
      'Bi-Monthly: Tighten motor mounting bolts and foot pedal link pins.',
    ],
    compatibleParts: [
      'Anti-Vibration Rubber Leveling Feet',
      'Embedded Self-Adhesive Metric Rule',
      'Under-Table Plastic Drawer Unit',
    ],
  },
  {
    id: 'TABLE_INSPECTION',
    name: 'QC Garment Quality Inspection Table',
    category: 'TABLE',
    subtitle: 'Overhead Canopy Illumination Measurement Bed',
    application:
      'Final measurement verification, shade sorting, sewing fault auditing, and tech-pack compliance checking before garment poly-bagging.',
    models: ['Godrej QC-Pro-800', 'VeriVide Inspection Bench'],
    specs: {
      'Top Dimensions': '8ft (240 cm) Length x 4ft (120 cm) Width',
      'Surface Finish': 'Matte non-glare reflection-free brilliant white laminate',
      'Overhead Canopy': 'Integrated tubular steel canopy arm with D65 daylight strip',
      'Grid Markings': 'Silk-screened 1 cm reference grid across entire top',
      'Holding Slopes': 'Rear inclined fabric slope for checked garment staging',
    },
    sop: [
      'Keep table surface completely free of pens, scissors, or tape that could stain garments.',
      'Wipe down surface with isopropyl alcohol at the start of each quality audit shift.',
    ],
    checklist: [
      'Daily: Clean matte top to remove loose threads, grease, or dust.',
      'Weekly: Inspect overhead light canopy switch and diffuser shield.',
      'Monthly: Verify table surface flatness using a precision straight edge.',
    ],
    compatibleParts: [
      'Non-Glare White Replacement Laminate',
      'Overhead Canopy Light Fixture',
      'Garment Slope Staging Bracket',
    ],
  },
  {
    id: 'TABLE_PACKING',
    name: 'Final Folding & Poly-Bagging Table',
    category: 'TABLE',
    subtitle: 'High-Throughput Packaging & Barcode Station',
    application:
      'End-of-line workstation for folding garments, attaching price tickets/hangtags, inserting into poly-bags, and scanning SKU barcodes into ERP.',
    models: ['Featherlite PackStation-10', 'Apex PolyMaster'],
    specs: {
      'Top Dimensions': '6ft (180 cm) Length x 3ft (90 cm) Width',
      'Upper Racks': 'Multi-tier wire rack for hangtags, care labels & barcode stickers',
      'Accessory Arms': 'Articulated swing arm for handheld barcode scanner',
      'Bag Dispenser': 'Under-shelf roller bar holding 3 sizes of poly-bag rolls',
    },
    sop: [
      'Stage cartons in lower bay to minimize twisting when packing folded garments.',
      'Scan every hangtag barcode before sealing poly-bag to eliminate shipment mismatches.',
    ],
    checklist: [
      'Daily: Check barcode scanner cable and swing arm swivel friction.',
      'Weekly: Wipe down poly-bag spool roller rods.',
    ],
    compatibleParts: ['Barcode Scanner Swing Bracket', 'Wire Hangtag Dispenser Shelf', 'Poly-Roll Roller Rod'],
  },

  // ==================== 3. CHAIR TYPES ====================
  {
    id: 'CHAIR_OPERATOR',
    name: 'Ergonomic Sewing Operator Swivel Chair',
    category: 'CHAIR',
    subtitle: 'High-Endurance 360° Pneumatic Line Seating',
    application:
      'Scientifically designed industrial operator seating engineered to provide proper pelvic tilt and lumbar support, preventing operator fatigue during 8-hour shifts.',
    models: ['Featherlite Optima-Sew360', 'Godrej Ergoflex Industrial', 'Dauphin Sewing Chair'],
    specs: {
      'Pneumatic Lift': 'Class 4 Heavy-Duty Nitrogen Gas Cylinder',
      'Height Range': '42 cm to 56 cm continuous stepless adjustment',
      'Arm Configuration': 'Armless design (allows unrestricted upper-body garment handling)',
      'Seat Cushion': 'High-resilience molded PU foam with water-resistant vinyl',
      'Base & Wheels': '5-star reinforced nylon base with thread-guarded dual casters',
      'Weight Rating': '150 kg tested dynamic working load',
    },
    sop: [
      'Adjust seat height so operator thighs are horizontal and feet rest flat on machine pedal.',
      'Never lock the backrest in a reclined position while operating sewing machines.',
    ],
    checklist: [
      'Shift-wise: Check if chair holds height without sinking under operator weight.',
      'Weekly: Remove wound sewing threads and lint from wheel axles to ensure free rolling.',
      'Monthly: Inspect backrest angle tightening knob and star base weld joints.',
    ],
    compatibleParts: [
      'Class 4 Heavy Gas-Lift Cylinder',
      'Thread-Guarded Nylon Caster Wheel',
      'High-Density Molded PU Seat Cushion',
    ],
  },
  {
    id: 'CHAIR_SUPERVISOR',
    name: 'High-Back Supervisor Drafting Chair',
    category: 'CHAIR',
    subtitle: 'Elevated Overview Seating with Circular Foot Ring',
    application:
      'Elevated seating for production floor supervisors, quality auditors, and line balance managers who require a high vantage point overlooking sewing lines.',
    models: ['Godrej Interio MotionDraft-High', 'Featherlite HighDraft-900'],
    specs: {
      'Height Range': '68 cm to 82 cm elevated range',
      'Footrest Ring': 'Heavy chrome-plated steel ring with height clamp',
      'Backrest': 'Ergonomic breathable double-layer mesh with lumbar cushion',
      'Tilt Mechanism': 'Multi-lock synchro-tilt mechanism',
    },
    sop: [
      'Adjust foot ring height so knees rest comfortably at a 90° angle when elevated.',
    ],
    checklist: [
      'Weekly: Verify foot ring locking collar is securely tightened.',
      'Monthly: Inspect pneumatic extension cylinder stability and caster wheel swivel.',
    ],
    compatibleParts: ['Chrome Footrest Ring Clamp', 'Heavy Extended Height Gas-Lift', 'Mesh Backrest Assembly'],
  },
  {
    id: 'CHAIR_STOOL',
    name: 'Master Mechanic Workshop Bay Stool',
    category: 'CHAIR',
    subtitle: 'Low-Profile Mobile Seating with Magnetic Parts Tray',
    application:
      'Low-height rolling technician stool used by maintenance staff when servicing machine under-beds, pedal rods, air dryers, and floor cable conduits.',
    models: ['Stanley MechSeat-Pro', 'Craftsman LowStool-360'],
    specs: {
      'Height Range': '38 cm to 50 cm low-profile range',
      'Seat Material': 'Oil-resistant heavy vinyl with high-density padding',
      'Bottom Tray': 'Segmented circular magnetic tray for holding screws, loopers, wrenches',
      'Casters': 'Heavy 3-inch polyurethane industrial ball-bearing wheels',
    },
    sop: [
      'Do not place hot soldering irons or naked flames on the vinyl cushion.',
      'Keep magnetic tray clean of metal shavings that could damage delicate sewing parts.',
    ],
    checklist: [
      'Weekly: Wipe down oil and grease residues from vinyl seat and base.',
      'Monthly: Lubricate ball-bearing wheel raceways.',
    ],
    compatibleParts: ['3-inch Industrial PU Caster', 'Magnetic Parts Tray Ring', 'Oil-Resistant Seat Pad'],
  },

  // ==================== 4. LIGHTING TYPES ====================
  {
    id: 'LIGHT_HIGHBAY',
    name: 'Overhead Linear High-Bay LED (150W)',
    category: 'LIGHT',
    subtitle: '750+ Lux Shadow-Free Line Illumination',
    application:
      'Suspended linear illumination fixtures hanging 3 meters above sewing lines, meeting international apparel standards of 750 to 1,000 Lux on sewing needles.',
    models: ['Philips CoreLine HighBay-150W', 'Wipro OptiGlow-120W', 'Havells LineaLED'],
    specs: {
      'Power Consumption': '150 Watt high-efficiency driver',
      'Luminous Output': '18,000 Lumens (120 lm/Watt efficacy)',
      'Color Temperature': '6,500K Cool Daylight',
      'CRI Rating': '85+ Ra (High color fidelity)',
      'Protection': 'IP65 Dust & Moisture proof with polycarbonate diffuser',
      'Lifespan': '50,000 burning hours (L70)',
    },
    sop: [
      'Ensure suspension steel cables are vertical and tensioned equally.',
      'Never operate with cracked diffuser covers in fabric sewing areas.',
    ],
    checklist: [
      'Monthly: Wipe off cotton lint and dust from the top aluminum heat sink fins.',
      'Quarterly: Inspect suspension cables, carabiners, and secondary safety wires.',
      'Bi-Annual: Test ballast driver power factor and operating temperature.',
    ],
    compatibleParts: ['150W Constant Current LED Driver', 'Polycarbonate Frosted Diffuser', 'Suspension Wire Carabiner Kit'],
  },
  {
    id: 'LIGHT_TASK',
    name: 'Needle Point Task Gooseneck Lamp',
    category: 'LIGHT',
    subtitle: 'High-Precision Concentrated Machine Light',
    application:
      'Focused, glare-free task light mounted directly on the sewing machine head or table stand, shining directly onto the needle hole, presser foot, and feed dog.',
    models: ['Oshima StitchBeam-30', 'Daylight Slimline LED', 'Sunbeam NeedleLamp'],
    specs: {
      'LED Array': '30 Ultra-bright SMD LEDs (5 Watt consumption)',
      'Gooseneck Arm': '360° Flexible 30 cm steel gooseneck with silicone sleeve',
      'Mounting': 'Heavy magnetic clamp base with table bolt adapter',
      'Optics': 'Integrated anti-glare lens shield with zero stroboscopic flicker',
      'Power Input': 'Direct 220V AC or servo motor auxiliary 12V port',
    },
    sop: [
      'Position lamp head at 45° angle to needle to prevent shadow cast by operator hands.',
      'Ensure magnet base is placed away from electronic encoder sensors on sewing head.',
    ],
    checklist: [
      'Weekly: Check gooseneck arm stiffness to ensure it does not drift during vibration.',
      'Monthly: Clean optical lens cover from lubricating oil spray.',
    ],
    compatibleParts: ['Magnetic Mounting Base', 'Replacement 30-LED Head Cluster', 'Gooseneck Flexible Arm'],
  },
  {
    id: 'LIGHT_INSPECTION',
    name: 'Color-Checking Inspection Light Strip (D65)',
    category: 'LIGHT',
    subtitle: 'Artificial Daylight Metamerism & Shade Matching',
    application:
      'Calibrated color-matching light tubes installed in Quality Inspection tables and fabric shade sorting rooms. Complies with ISO 105 and ASTM D1729.',
    models: ['VeriVide ColorCheck-D65', 'GretagMacbeth Judge II', 'Philips Master TL-D 90'],
    specs: {
      'Color Temperature': '6,500K (CIE Illuminant D65 artificial daylight)',
      'CRI Rating': '98+ Ra (Exceptional color rendering index)',
      'Tube Length': '120 cm (4ft) 36W T8 Tube',
      'Hour Counter': 'Digital elapsed hour timer for calibration monitoring',
    },
    sop: [
      'Replace tubes strictly at 2,000 operating hours to maintain color spectrum accuracy.',
      'Allow tubes to warm up for 5 minutes before conducting critical shade sorting.',
    ],
    checklist: [
      'Weekly: Record elapsed hours from digital timer.',
      'Monthly: Clean tube and reflector with dry anti-static lint cloth.',
    ],
    compatibleParts: ['VeriVide 36W D65 Tube', 'Electronic High-Frequency Ballast', 'Hour Meter Timer Module'],
  },

  // ==================== 5. FAN & VENTILATION TYPES ====================
  {
    id: 'FAN_CEILING',
    name: 'Heavy Industrial Ceiling Fan (56")',
    category: 'FAN',
    subtitle: 'High-Volume Production Hall Air Circulation',
    application:
      'Continuous overhead air delivery across sewing operator line aisles to disperse localized motor heat and maintain thermal comfort in garment plants.',
    models: ['Havells IndusAir-56', 'Crompton FactoryAir Heavy', 'Almonard AirGlide-56'],
    specs: {
      'Blade Sweep': '1,400 mm (56 inches) Aerodynamic heavy aluminum blades',
      'Motor': '100% Copper winding high-torque motor (75W consumption)',
      'Rotational Speed': '320 RPM high-speed delivery',
      'Air Delivery': '270 m3/min (High displacement)',
      'Bearing': 'Double deep-groove shielded ball bearings with lifetime lubrication',
      'Safety': 'Heavy-gauge steel downrod with redundant secondary safety cable',
    },
    sop: [
      'Ensure secondary safety cable is looped securely around building roof purlins.',
      'Never operate fan if wobbling or blade pitch imbalance is observed.',
    ],
    checklist: [
      'Monthly: Inspect downrod split pin, bolt torque, and safety wire clamp.',
      'Monthly: Clean lint buildup from blade leading edges to maintain aerofoil lift.',
      'Bi-Annual: Test motor capacitor microfarad rating (replace if speed drops).',
    ],
    compatibleParts: ['56-inch Aluminum Blade Set', 'Motor Start/Run Capacitor (2.5uF)', 'Steel Downrod Safety Cable Kit'],
  },
  {
    id: 'FAN_PEDESTAL',
    name: 'High-Velocity Floor Standing Pedestal Fan',
    category: 'FAN',
    subtitle: 'Targeted Cooling for High-Heat Finishing Areas',
    application:
      'Heavy-duty mobile floor blowers used for intensive localized air delivery at collar fusing presses, steam ironing stations, and line ends.',
    models: ['Almonard AirMax-24P', 'Usha Tornado-24', 'Crompton Storm-24'],
    specs: {
      'Blade Sweep': '600 mm (24 inches) High-pitch aerofoil blades',
      'Speed': '1,400 RPM (High-velocity industrial motor)',
      'Air Delivery': '14,000 m3/hour (Massive wind velocity)',
      'Oscillation': '90° Automatic motorized sweep or locked fixed beam',
      'Base': 'Heavy cast-iron circular base (20 kg) to prevent tip-over',
    },
    sop: [
      'Ensure electrical cable is routed through floor conduits, not exposed to foot traffic.',
      'Lock oscillation head when cooling continuous steam finishing ironers.',
    ],
    checklist: [
      'Weekly: Clean wire finger-guard grill from cotton lint accumulation.',
      'Monthly: Check oscillation gearbox linkage and grease gears.',
      'Quarterly: Inspect power cord for insulation chafing.',
    ],
    compatibleParts: ['24-inch Heavy Aluminum Blade', 'Oscillation Gearbox Assembly', 'Cast-Iron Pedestal Base'],
  },
  {
    id: 'FAN_EXHAUST',
    name: 'Wall-Mount Heavy Duty Exhaust Blower',
    category: 'FAN',
    subtitle: 'Cotton Lint & Fume Extraction Blower',
    application:
      'Continuous wall-mounted extraction system for removing airborne cotton dust, denim lint, and maintenance solvent fumes from factory halls.',
    models: ['Almonard HeavyDuty-18', 'Crompton Industrial Vent', 'Vent-Axia Industrial'],
    specs: {
      'Impeller Diameter': '450 mm (18 inches) Dynamically balanced steel impeller',
      'Speed': '1,400 RPM heavy induction motor',
      'Air Extraction': '4,500 m3/hour high-vacuum extraction',
      'Enclosure': 'IP55 Dust-proof totally enclosed motor',
      'External Louver': 'Automatic gravity-closing steel weather louvers',
    },
    sop: [
      'Do not tamper with gravity louvers; ensure they open fully when fan is active.',
    ],
    checklist: [
      'Weekly: Brush off heavy cotton lint from impeller blades and wire guard.',
      'Monthly: Verify external gravity louvers swing freely without sticking.',
      'Quarterly: Inspect motor bearing temperature and vibration with tachometer.',
    ],
    compatibleParts: ['18-inch Balanced Impeller', 'Automatic Gravity Louver Shutter', 'IP55 Induction Motor'],
  },

  // ==================== 6. UTILITY TYPES ====================
  {
    id: 'UTILITY_BOILER',
    name: 'Central Industrial Steam Iron Generator Boiler',
    category: 'UTILITY',
    subtitle: '6-Bar Pressurized Steam Generation Unit',
    application:
      'Generates continuous high-temperature dry steam piped across all factory lines to feed gravity-iron stations, seam under-presses, and collar fusing units.',
    models: ['Silver Star SteamMaster-30KW', 'Veit SteamCenter-500', 'Trevil Industrial'],
    specs: {
      'Heating Power': '30 kW 3-Phase Electric Immersion Heating Elements',
      'Operating Pressure': '4.5 to 6.0 Bar continuous regulated steam',
      'Steam Output': '40 kg/hour dry saturated steam',
      'Safety Systems': 'Dual spring-loaded safety relief valves, low-water cutoff sensor',
      'Feed Pump': 'High-pressure multi-stage stainless steel automatic feed pump',
    },
    sop: [
      'Perform daily boiler blowdown under 2 Bar pressure to purge mineral scale buildup.',
      'Ensure water softening treatment plant is active before feeding boiler.',
    ],
    checklist: [
      'Daily: Blow down boiler sediment for 10 seconds before starting morning shift.',
      'Daily: Inspect water sight glass level and pressure gauge reading.',
      'Weekly: Test emergency low-water electrical cut-off sensor.',
      'Monthly: Manually trigger safety relief valve to ensure valve disk is not stuck.',
    ],
    compatibleParts: ['Dual 6-Bar Safety Relief Valve', 'Immersion Heating Element 10kW', 'Water Gauge Glass Tube Set'],
  },
  {
    id: 'UTILITY_COMPRESSOR',
    name: 'Rotary Screw Industrial Air Compressor',
    category: 'UTILITY',
    subtitle: 'Continuous 10-Bar Compressed Air Supply',
    application:
      'Provides high-volume, clean, moisture-free compressed air powering automatic thread trimmers, needle cooling jets, pneumatic work clamps, and lint blow guns.',
    models: ['Atlas Copco G-11-FF', 'Ingersoll Rand R-Series 11kW', 'Kaeser AirTower'],
    specs: {
      'Motor Power': '11 kW (15 HP) High-efficiency IE3 drive motor',
      'Working Pressure': '10.0 Bar (145 PSI)',
      'Air Flow Rate': '1.65 m3/min (58 CFM)',
      'Air Dryer': 'Integrated refrigerated dryer with 3°C pressure dew point',
      'Air Receiver Tank': '500 Liters vertical pressure vessel (ASME certified)',
    },
    sop: [
      'Check compressor oil level daily; only use certified synthetic rotary screw oil.',
      'Ensure refrigerated air dryer is switched on 5 minutes prior to air compressor start.',
    ],
    checklist: [
      'Daily: Check oil level sight glass while running loaded.',
      'Daily: Verify electronic timer auto-drain is pulsing and expelling moisture.',
      'Weekly: Inspect intake air filter element restriction gauge.',
      'Monthly: Check V-belt tension and clean oil cooler radiator fins.',
    ],
    compatibleParts: ['Rotary Screw Synthetic Oil (5L)', 'Oil Separator Filter Cartridge', 'Intake Air Filter Element'],
  },
  {
    id: 'UTILITY_SAFETY',
    name: 'Line Emergency Fire Safety & Suppression Station',
    category: 'UTILITY',
    subtitle: 'First-Response Electrical & Fabric Fire Units',
    application:
      'Mandatory factory safety station mounted at line heads to provide instant first-response suppression for electrical motor fires or fabric lint fires.',
    models: ['Ceasefire QuickResponse-Twin', 'Minimax Industrial Safety Station'],
    specs: {
      'CO2 Unit': '4.5 kg Carbon Dioxide extinguisher (For electrical panels & machines)',
      'ABC Powder Unit': '6.0 kg MAP 90 Dry Powder (For fabrics, wood, boxes, paper)',
      'Mounting': 'Heavy tubular steel station frame with high-visibility sign',
      'Inspection Tag': 'Monthly barcode audited safety inspection card',
    },
    sop: [
      'Use CO2 unit for sewing machines or motor fires to prevent residue damage to electronics.',
      'Aim at base of fire using PASS technique (Pull, Aim, Squeeze, Sweep).',
    ],
    checklist: [
      'Monthly: Inspect pressure gauge needle (must rest firmly in green zone).',
      'Monthly: Check safety locking pin and plastic tamper seal integrity.',
      'Monthly: Weigh CO2 cartridge to verify no slow valve discharge.',
    ],
    compatibleParts: ['CO2 Discharge Horn & Hose', 'Safety Locking Pin & Lead Seal', 'Annual Hydrostatic Test Ring'],
  },
];

function AssetTypesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCat = (searchParams.get('category') as AssetCategory) || 'MACHINE';
  const initialType = searchParams.get('type') || '';

  const [activeCategory, setActiveCategory] = useState<AssetCategory>(initialCat);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveId, setTargetMoveId] = useState('');

  useEffect(() => {
    const unsub = subscribeMachines((data) => setMachines(data));
    return () => unsub();
  }, []);

  // Update active category if URL param changes
  useEffect(() => {
    const cat = searchParams.get('category') as AssetCategory;
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }
    const t = searchParams.get('type');
    if (t) {
      setSelectedType(t);
    }
  }, [searchParams]);

  // Filter catalog by active category
  const categoryTypes = useMemo(() => {
    return ASSET_TYPES_CATALOG.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  // Default selected type to first in category if not selected or invalid
  useEffect(() => {
    if (categoryTypes.length > 0) {
      const match = categoryTypes.find((t) => t.id === selectedType);
      if (!match) {
        setSelectedType(categoryTypes[0].id);
      }
    }
  }, [categoryTypes, selectedType]);

  const activeSpec = useMemo(() => {
    return (
      categoryTypes.find((t) => t.id === selectedType) ||
      categoryTypes[0] ||
      ASSET_TYPES_CATALOG[0]
    );
  }, [categoryTypes, selectedType]);

  // Find physical fleet machines matching activeSpec
  const stagedUnits = useMemo(() => {
    if (!activeSpec) return [];
    return machines.filter((m) => {
      // Direct type match or category match if type name matches
      const cat = m.category || 'MACHINE';
      if (cat !== activeSpec.category) return false;

      if (m.type === activeSpec.id) return true;
      if (m.typeName?.toLowerCase().includes(activeSpec.name.toLowerCase())) return true;
      if (activeSpec.id === 'TABLE_CUTTING' && m.id.startsWith('TBL-CUT')) return true;
      if (activeSpec.id === 'TABLE_SEWING' && m.id.startsWith('TBL-SEW')) return true;
      if (activeSpec.id === 'TABLE_INSPECTION' && m.id.startsWith('TBL-INSP')) return true;
      if (activeSpec.id === 'CHAIR_OPERATOR' && m.id.startsWith('CHR-ERG')) return true;
      if (activeSpec.id === 'CHAIR_SUPERVISOR' && m.id.startsWith('CHR-SUP')) return true;
      if (activeSpec.id === 'CHAIR_STOOL' && m.id.startsWith('CHR-STL')) return true;
      if (activeSpec.id === 'LIGHT_HIGHBAY' && m.id.startsWith('LGT-HBY')) return true;
      if (activeSpec.id === 'LIGHT_TASK' && m.id.startsWith('LGT-TSK')) return true;
      if (activeSpec.id === 'FAN_CEILING' && m.id.startsWith('FAN-CEIL')) return true;
      if (activeSpec.id === 'FAN_PEDESTAL' && m.id.startsWith('FAN-PED')) return true;
      if (activeSpec.id === 'FAN_EXHAUST' && m.id.startsWith('FAN-EXH')) return true;
      if (activeSpec.id === 'UTILITY_BOILER' && m.id.startsWith('UTL-BLR')) return true;
      if (activeSpec.id === 'UTILITY_COMPRESSOR' && m.id.startsWith('UTL-CMP')) return true;
      if (activeSpec.id === 'UTILITY_SAFETY' && m.id.startsWith('UTL-SFT')) return true;

      return false;
    });
  }, [machines, activeSpec]);

  const handleCategorySwitch = (cat: AssetCategory) => {
    setActiveCategory(cat);
    const firstType = ASSET_TYPES_CATALOG.find((t) => t.category === cat);
    if (firstType) {
      setSelectedType(firstType.id);
      router.push(`/dashboard/asset-types?category=${cat}&type=${firstType.id}`);
    } else {
      router.push(`/dashboard/asset-types?category=${cat}`);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    router.push(`/dashboard/asset-types?category=${activeCategory}&type=${typeId}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/floor-tracker"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Floor Grid</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-700">Asset Specifications & Catalog</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <span>Factory Asset Types & Technical Standards Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            In-depth engineering profiles, Standard Operating Procedures (SOP), preventive maintenance checklists, and live deployed units for every asset type in the plant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/floor-tracker"
            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
            <span>Return to Asset Floor Grid</span>
          </Link>
        </div>
      </div>

      {/* Main 6 Category Switcher Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            id: 'MACHINE',
            label: 'Machine Types',
            sub: 'SNLS, Overlock, Bartack',
            icon: Wrench,
            activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
            idleClass: 'bg-indigo-50/60 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
          },
          {
            id: 'TABLE',
            label: 'Table Types',
            sub: 'Cutting, Work, Inspection',
            icon: LayoutGrid,
            activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm',
            idleClass: 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100',
          },
          {
            id: 'CHAIR',
            label: 'Chair Types',
            sub: 'Operator Swivel & Stools',
            icon: Armchair,
            activeClass: 'bg-teal-600 text-white border-teal-600 shadow-sm',
            idleClass: 'bg-teal-50/60 text-teal-800 border-teal-200 hover:bg-teal-100',
          },
          {
            id: 'LIGHT',
            label: 'Lighting Types',
            sub: 'High-Bay & Task Gooseneck',
            icon: Lightbulb,
            activeClass: 'bg-yellow-600 text-white border-yellow-600 shadow-sm',
            idleClass: 'bg-yellow-50/60 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
          },
          {
            id: 'FAN',
            label: 'Fan Types',
            sub: '56" Ceiling & Exhaust',
            icon: Fan,
            activeClass: 'bg-cyan-600 text-white border-cyan-600 shadow-sm',
            idleClass: 'bg-cyan-50/60 text-cyan-800 border-cyan-200 hover:bg-cyan-100',
          },
          {
            id: 'UTILITY',
            label: 'Utility Types',
            sub: 'Steam Boilers & Compressors',
            icon: Flame,
            activeClass: 'bg-purple-600 text-white border-purple-600 shadow-sm',
            idleClass: 'bg-purple-50/60 text-purple-800 border-purple-200 hover:bg-purple-100',
          },
        ].map((item) => {
          const IconC = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategorySwitch(item.id as AssetCategory)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isActive ? item.activeClass : item.idleClass
              }`}
            >
              <div className="flex items-center justify-between">
                <IconC className="w-4 h-4" />
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="mt-2">
                <div className="font-bold text-xs">{item.label}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Left Side Specific Types List | Right Side Deep Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specific Type List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Available {activeCategory} Types</span>
            <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {categoryTypes.length} Types
            </span>
          </div>

          <div className="space-y-2">
            {categoryTypes.map((t) => {
              const isSelected = t.id === selectedType;
              const countOnFloor = machines.filter((m) => {
                const cat = m.category || 'MACHINE';
                return cat === t.category && (m.type === t.id || m.typeName?.includes(t.name) || m.id.startsWith(t.id.slice(0, 3)));
              }).length;

              return (
                <div
                  key={t.id}
                  onClick={() => handleTypeSelect(t.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {t.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {countOnFloor} on Floor
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{t.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {t.application}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                    <span className="truncate">{t.models[0]}</span>
                    <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Technical Dossier & Floor Units (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeSpec ? (
            <div className="space-y-5">
              {/* Type Hero Banner */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white">
                        {activeSpec.id}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">{activeSpec.name}</h3>
                    </div>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{activeSpec.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{stagedUnits.length} Deployed Units</span>
                    </span>
                  </div>
                </div>

                {/* Purpose & Garment Function */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Garment Manufacturing Role & Application
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeSpec.application}</p>
                </div>

                {/* Typical Plant Brand Models */}
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-slate-400 font-medium">Recognized Plant Brands:</span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {activeSpec.models.map((mod) => (
                      <span
                        key={mod}
                        className="bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Technical Engineering Specifications</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {Object.entries(activeSpec.specs).map(([label, val]) => (
                    <div
                      key={label}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
                    >
                      <span className="text-slate-500 font-medium">{label}:</span>
                      <strong className="text-slate-900 font-mono text-[11px] text-right ml-2">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standard Operating Procedures & Preventive Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SOP */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Operating Standards (SOP)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {activeSpec.sop.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-indigo-50/40 p-2 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-full shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Maintenance Checklist */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Inspection & Servicing Checklist</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {activeSpec.checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-emerald-50/40 p-2 rounded-xl border border-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Live Staged Fleet Instances On The Floor */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Physical Fleet Units Operating on Floor ({stagedUnits.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Live staging status</span>
                </div>

                {stagedUnits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No physical units of this type currently staged in the factory database.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stagedUnits.map((u) => {
                      const isDown = u.status === 'BREAKDOWN';
                      const isBuffer = u.status === 'BUFFER';
                      const isScrap = u.status === 'SCRAP';

                      const dotColor = isDown
                        ? 'bg-rose-500 animate-ping'
                        : isBuffer
                        ? 'bg-amber-500'
                        : isScrap
                        ? 'bg-slate-400'
                        : 'bg-emerald-500';

                      const badgeClass = isDown
                        ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                        : isBuffer
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : isScrap
                        ? 'bg-slate-100 border-slate-300 text-slate-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';

                      return (
                        <div
                          key={u.id}
                          className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                              <span className="font-mono font-extrabold text-slate-900">{u.id}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                              {u.status}
                            </span>
                          </div>

                          <div>
                            <div className="font-bold text-slate-800 text-[11px] truncate">
                              {u.name || `${u.brand} ${u.model}`}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                              <span>
                                {u.currentLine} • {u.stationNo}
                              </span>
                              <span className="font-mono font-semibold">${u.cost || 0}</span>
                            </div>
                          </div>

                          {u.specs && (
                            <div className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200/60 truncate">
                              {u.specs}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-slate-400">
                              {u.operator ? `Operator: ${u.operator}` : 'Unassigned'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetMoveId(u.id);
                                setIsMoveModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Manage / Move</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compatible Tool Crib Spare Parts */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Compatible Tool Crib Spare Parts & Replacements</span>
                  </h4>
                  <Link
                    href="/dashboard/inventory"
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>View Tool Crib Inventory</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {activeSpec.compatibleParts.map((p) => (
                    <div
                      key={p}
                      className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              Select an asset type to view technical specifications.
            </div>
          )}
        </div>
      </div>

      {/* Relocate / Defect Modal */}
      <ScanModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        preselectedMachineId={targetMoveId}
      />
    </div>
  );
}

export default function AssetTypesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-medium">Loading Asset Types Catalog...</div>}>
      <AssetTypesContent />
    </Suspense>
  );
}
