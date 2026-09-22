import { MachineType } from '@/types/cmms';

export type MachineCategoryGroup = 'OVERLOCK' | 'FLATLOCK' | 'SINGLE_NEEDLE';

export interface MachineSubtypeDef {
  id: MachineType;
  name: string;
  category: MachineCategoryGroup;
  categoryName: string;
  brands: string[];
  defaultBrand: string;
  defaultModel: string;
  specs: string;
}

export interface MachineCategoryDef {
  id: MachineCategoryGroup;
  name: string;
  description: string;
  brands: string[];
  subtypes: MachineSubtypeDef[];
}

export const MACHINE_CATALOG: MachineCategoryDef[] = [
  {
    id: 'OVERLOCK',
    name: 'Overlock Machine',
    description: 'High-speed edge overedging, seaming, and trimming machinery',
    brands: ['Yamato', 'Supreme'],
    subtypes: [
      {
        id: 'OVERLOCK_4_THREAD',
        name: '4 Thread Overlock',
        category: 'OVERLOCK',
        categoryName: 'Overlock',
        brands: ['Yamato', 'Supreme'],
        defaultBrand: 'Yamato',
        defaultModel: 'AZ-8000G / 4-Thread High-Speed',
        specs: '4-thread safety stitch, differential feed ratio 1:0.7–1:2, max 7,500 RPM, auto-lubrication',
      },
      {
        id: 'OVERLOCK_RIB_THREAD',
        name: 'Rib Thread Overlock',
        category: 'OVERLOCK',
        categoryName: 'Overlock',
        brands: ['Yamato', 'Supreme'],
        defaultBrand: 'Yamato',
        defaultModel: 'AZ-8500-Rib Attacher',
        specs: 'Pneumatic rib collar feeder, tension-controlled rib knit insertion, 7,000 RPM',
      },
      {
        id: 'OVERLOCK_LFC',
        name: 'LFC Overlock',
        category: 'OVERLOCK',
        categoryName: 'Overlock',
        brands: ['Yamato', 'Supreme'],
        defaultBrand: 'Supreme',
        defaultModel: 'SP-LFC-900 Electronic',
        specs: 'Light/Fine cloth edge overlock, micro-sensor needle positioning, 6,800 RPM',
      },
    ],
  },
  {
    id: 'FLATLOCK',
    name: 'Flatlock Machine',
    description: 'Interlock and coverstitch sewing machinery for activewear and knitwear',
    brands: ['Yamato'],
    subtypes: [
      {
        id: 'FLATLOCK_HEMMING',
        name: 'Hemming Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VG-2700-Hemming / UTT',
        specs: 'Bottom hem blindfold guide, auto underbed thread trimmer (UTT), 3-needle 5-thread, 6,000 RPM',
      },
      {
        id: 'FLATLOCK_SMALL_CYLINDER',
        name: 'Small Cylinder Bed Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VG-3721-SCB Small Cylinder',
        specs: '180mm mini cylinder circumference for tubular children cuffs and ankle openings, 5,500 RPM',
      },
      {
        id: 'FLATLOCK_CYLINDER_BED',
        name: 'Cylinder Bed Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VG-2700-CB Cylinder Bed',
        specs: 'Tubular garment assembly, 280mm cylinder bed circumference, top and bottom coverstitch',
      },
      {
        id: 'FLATLOCK_FLAT_BED',
        name: 'Flat Bed Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VF-2500-Flat Bed Series',
        specs: 'Spacious wide flatbed work area for panels, decorative flat seaming, differential feed',
      },
      {
        id: 'FLATLOCK_VT',
        name: 'VT Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VT-1500-Pro High-Lift',
        specs: 'Variable Top-feed coverstitch with synchronized upper looper motion, 6,000 RPM',
      },
      {
        id: 'FLATLOCK_TOP_ELASTIC',
        name: 'Top Elastic Flatlock',
        category: 'FLATLOCK',
        categoryName: 'Flatlock',
        brands: ['Yamato'],
        defaultBrand: 'Yamato',
        defaultModel: 'VG-2790-ET Top Elastic Attacher',
        specs: 'Computerized stepping motor elastic tape meter & feed mechanism, right-edge fabric trimmer',
      },
    ],
  },
  {
    id: 'SINGLE_NEEDLE',
    name: 'Single Needle Machine',
    description: 'Precision automated single needle indexers, button attachers, and bartack machines',
    brands: ['Brother', 'Supreme'],
    subtypes: [
      {
        id: 'SN_BROTHER_KAJA',
        name: 'Brother KAJA (Buttonhole)',
        category: 'SINGLE_NEEDLE',
        categoryName: 'Single Needle Machine',
        brands: ['Brother', 'Supreme'],
        defaultBrand: 'Brother',
        defaultModel: 'HE-800B KAJA Electronic',
        specs: 'Electronic indexer, pulse motor knife drop, 21 preset buttonhole eyelet stitch patterns',
      },
      {
        id: 'SN_BROTHER_BUTTON_STITCH',
        name: 'Brother Button Stitch',
        category: 'SINGLE_NEEDLE',
        categoryName: 'Single Needle Machine',
        brands: ['Brother', 'Supreme'],
        defaultBrand: 'Brother',
        defaultModel: 'BE-438F Direct-Drive Button Attacher',
        specs: 'Direct-drive lockstitch button sewing, quick-change clamp for 2-hole & 4-hole buttons',
      },
      {
        id: 'SN_BROTHER_BARTACK',
        name: 'Brother Bartack',
        category: 'SINGLE_NEEDLE',
        categoryName: 'Single Needle Machine',
        brands: ['Brother', 'Supreme'],
        defaultBrand: 'Brother',
        defaultModel: 'KE-430FS Electronic Direct-Drive Bartack',
        specs: 'High-speed 3,200 SPM electronic bartacker, direct-drive servo, 89 programmed patterns',
      },
    ],
  },
];

// Flat lookup map of all 12 subtypes
export const ALL_SEWING_SUBTYPES: MachineSubtypeDef[] = MACHINE_CATALOG.flatMap(
  (cat) => cat.subtypes
);

export const SUBTYPE_LOOKUP: Record<string, MachineSubtypeDef> = ALL_SEWING_SUBTYPES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, MachineSubtypeDef>
);

export function getMachineSubtypeMeta(type: MachineType): MachineSubtypeDef | undefined {
  return SUBTYPE_LOOKUP[type];
}

export function getCategoryForType(type: MachineType): MachineCategoryGroup {
  if (type.startsWith('OVERLOCK')) return 'OVERLOCK';
  if (type.startsWith('FLATLOCK')) return 'FLATLOCK';
  if (type.startsWith('SN_BROTHER') || type === 'SNLS' || type === 'BARTACK' || type === 'BUTTONHOLE')
    return 'SINGLE_NEEDLE';
  return 'SINGLE_NEEDLE';
}
