import type { CatalogueItem } from '../types';

export const catalogueSeed: CatalogueItem[] = [
  // ── Autokoi — Steering & Suspension ──
  { id: 'CAT-001', partName: 'Rack End Assy', partNumber: 'AK-2045', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno'], side: 'both', mrp: 650, rackLocation: 'B1-05' },
  { id: 'CAT-002', partName: 'Tie Rod End Assy - Set', partNumber: 'AK-3012', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno', 'Ignis'], mrp: 750, rackLocation: 'B1-06' },
  { id: 'CAT-003', partName: 'Tie Rod End Assy - Pair', partNumber: 'AK-3015', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['i20', 'Verna', 'Creta', 'Venue'], mrp: 820, rackLocation: 'B1-07' },
  { id: 'CAT-004', partName: 'Suspension Ball Joint Assy', partNumber: 'AK-4078', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ignis'], position: 'front', mrp: 550 },
  { id: 'CAT-005', partName: 'Front Stabilizer Link Assy - Set', partNumber: 'AK-5033', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ciaz'], position: 'front', mrp: 480 },
  { id: 'CAT-006', partName: 'Track Control Arm Assy - Pair', partNumber: 'AK-6022', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno'], position: 'front', mrp: 2200 },
  { id: 'CAT-007', partName: 'Power Steering Assy', partNumber: 'AK-7001', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Swift 2011-2017', 'Dzire 2012-2017'], mrp: 8500 },
  { id: 'CAT-008', partName: 'I Shaft Lower Assy', partNumber: 'AK-9044', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz'], mrp: 1200 },
  { id: 'CAT-009', partName: 'Upper Column Assy', partNumber: 'AK-9055', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Alto', 'WagonR', 'Alto K10'], mrp: 1400 },
  { id: 'CAT-010', partName: 'RBS Steering Gear Assy', partNumber: 'AK-7055', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Alto', 'WagonR', 'Alto K10'], mrp: 12000 },
  { id: 'CAT-011', partName: 'Manual Steering Assy', partNumber: 'AK-7060', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Eeco', 'Omni'], mrp: 6500 },
  { id: 'CAT-012', partName: 'Power Steering Pump Assy', partNumber: 'AK-7080', brand: 'Autokoi', category: 'Steering Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ciaz', 'Ertiga'], mrp: 4500 },
  { id: 'CAT-013', partName: 'Front Susp. Bushing Kit', partNumber: 'AK-1077', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno', 'Ignis'], position: 'front', mrp: 320 },
  { id: 'CAT-014', partName: 'Trailing Arm Bush', partNumber: 'AK-1088', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'rear', mrp: 280 },
  { id: 'CAT-015', partName: 'Front Stabilizer Bar Bush', partNumber: 'AK-1099', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos', 'i20'], position: 'front', mrp: 180 },
  { id: 'CAT-016', partName: 'Damper Strut Mount', partNumber: 'AK-8015', brand: 'Autokoi', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ignis', 'WagonR'], position: 'front', mrp: 380 },
  { id: 'CAT-017', partName: 'Front Engine Mounting', partNumber: 'AK-EM-01', brand: 'Autokoi', category: 'Engine Mounting', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'front', mrp: 850 },
  { id: 'CAT-018', partName: 'Rear Engine Mounting', partNumber: 'AK-EM-02', brand: 'Autokoi', category: 'Engine Mounting', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'rear', mrp: 750 },

  // ── Brembo — Brake Parts ──
  { id: 'CAT-019', partName: 'Brake Pad Set - Front', partNumber: 'BRM-2045', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno'], position: 'front', mrp: 1000 },
  { id: 'CAT-020', partName: 'Brake Pad Set - Rear', partNumber: 'BRM-3067', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ciaz'], position: 'rear', mrp: 900 },
  { id: 'CAT-021', partName: 'Brake Disc - Front', partNumber: 'BRM-4521', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Creta', 'Seltos', 'i20'], position: 'front', mrp: 1400 },
  { id: 'CAT-022', partName: 'Brake Disc - Rear', partNumber: 'BRM-4530', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Creta', 'Seltos', 'Hector'], position: 'rear', mrp: 1200 },
  { id: 'CAT-023', partName: 'Brake Drum - Rear', partNumber: 'BRM-5010', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Swift', 'Dzire', 'WagonR', 'Alto'], position: 'rear', mrp: 800 },
  { id: 'CAT-024', partName: 'Brake Shoe Set - Rear', partNumber: 'BRM-6020', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Alto', 'WagonR'], position: 'rear', mrp: 600 },
  { id: 'CAT-025', partName: 'Brake Master Cylinder', partNumber: 'BRM-7001', brand: 'Brembo', category: 'Brake Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz'], mrp: 2200 },

  // ── Monroe — Shock Absorbers ──
  { id: 'CAT-026', partName: 'Shock Absorber - Front LH', partNumber: 'MN-G8802', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['Swift 2018+', 'Dzire 2017+', 'Baleno'], position: 'front', side: 'left', mrp: 2000 },
  { id: 'CAT-027', partName: 'Shock Absorber - Front RH', partNumber: 'MN-G8803', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['Swift 2018+', 'Dzire 2017+', 'Baleno'], position: 'front', side: 'right', mrp: 2000 },
  { id: 'CAT-028', partName: 'Shock Absorber - Rear', partNumber: 'MN-G8810', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'rear', mrp: 1600 },
  { id: 'CAT-029', partName: 'Strut Kit - Front', partNumber: 'MN-SK102', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['i20', 'i20 N Line', 'Verna'], position: 'front', mrp: 3500 },
  { id: 'CAT-030', partName: 'Shock Absorber - Front LH', partNumber: 'MN-G9201', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos'], position: 'front', side: 'left', mrp: 2800 },
  { id: 'CAT-031', partName: 'Shock Absorber - Rear', partNumber: 'MN-G9210', brand: 'Monroe', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos', 'Venue'], position: 'rear', mrp: 2200 },

  // ── SKF — Bearings ──
  { id: 'CAT-032', partName: 'Wheel Bearing - Front', partNumber: 'SKF-BAHB636193', brand: 'SKF', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz', 'Baleno'], position: 'front', mrp: 950 },
  { id: 'CAT-033', partName: 'Wheel Bearing - Rear', partNumber: 'SKF-BAHB633966', brand: 'SKF', category: 'Suspension Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'rear', mrp: 850 },
  { id: 'CAT-034', partName: 'Wheel Bearing Kit - Front', partNumber: 'SKF-VKBA7451', brand: 'SKF', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos', 'i20'], position: 'front', mrp: 1600 },

  // ── Valeo — Clutch ──
  { id: 'CAT-035', partName: 'Clutch Plate', partNumber: 'VL-826842', brand: 'Valeo', category: 'Clutch Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz'], mrp: 1500 },
  { id: 'CAT-036', partName: 'Clutch Pressure Plate', partNumber: 'VL-826843', brand: 'Valeo', category: 'Clutch Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ritz'], mrp: 2200 },
  { id: 'CAT-037', partName: 'Clutch Kit (3-in-1)', partNumber: 'VL-832009', brand: 'Valeo', category: 'Clutch Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], mrp: 5500 },
  { id: 'CAT-038', partName: 'Clutch Release Bearing', partNumber: 'VL-830001', brand: 'Valeo', category: 'Clutch Parts', vehicleCompatibility: ['Swift', 'Dzire', 'Ertiga', 'Ciaz'], mrp: 800 },

  // ── Bosch — Filters, Electrical ──
  { id: 'CAT-039', partName: 'Fuel Filter', partNumber: 'BSH-F5003', brand: 'Bosch', category: 'Filters', vehicleCompatibility: ['Swift Diesel', 'Dzire Diesel', 'Baleno Diesel'], mrp: 220 },
  { id: 'CAT-040', partName: 'Oil Filter', partNumber: 'BSH-P3314', brand: 'Bosch', category: 'Filters', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ciaz', 'Ertiga'], mrp: 200 },
  { id: 'CAT-041', partName: 'Air Filter', partNumber: 'BSH-S3588', brand: 'Bosch', category: 'Filters', vehicleCompatibility: ['Swift', 'Dzire 2017-2024', 'Baleno'], mrp: 320 },
  { id: 'CAT-042', partName: 'Cabin Filter', partNumber: 'BSH-M2056', brand: 'Bosch', category: 'Filters', vehicleCompatibility: ['Creta', 'Seltos', 'i20', 'Verna'], mrp: 450 },
  { id: 'CAT-043', partName: 'Wiper Blade - Front Set', partNumber: 'BSH-ECO-SET', brand: 'Bosch', category: 'Accessories', vehicleCompatibility: ['Swift', 'Dzire', 'WagonR', 'Alto K10'], mrp: 700 },
  { id: 'CAT-044', partName: 'Spark Plug - Iridium', partNumber: 'BSH-FR7KI332S', brand: 'Bosch', category: 'Ignition', vehicleCompatibility: ['Swift', 'Baleno', 'Ciaz', 'Ertiga', 'XL6'], mrp: 450 },
  { id: 'CAT-045', partName: 'Starter Motor', partNumber: 'BSH-SM1234', brand: 'Bosch', category: 'Electrical', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], mrp: 5500 },
  { id: 'CAT-046', partName: 'Alternator', partNumber: 'BSH-AL5678', brand: 'Bosch', category: 'Electrical', vehicleCompatibility: ['Swift', 'Dzire', 'Ciaz'], mrp: 7500 },

  // ── NGK — Ignition ──
  { id: 'CAT-047', partName: 'Spark Plug (Iridium)', partNumber: 'NGK-ILKR7B', brand: 'NGK', category: 'Ignition', vehicleCompatibility: ['Swift', 'Baleno', 'Ciaz', 'Ertiga', 'XL6'], mrp: 400 },
  { id: 'CAT-048', partName: 'Spark Plug (Platinum)', partNumber: 'NGK-BKR6EP', brand: 'NGK', category: 'Ignition', vehicleCompatibility: ['Alto', 'WagonR', 'Eeco'], mrp: 250 },
  { id: 'CAT-049', partName: 'Ignition Coil', partNumber: 'NGK-U5052', brand: 'NGK', category: 'Ignition', vehicleCompatibility: ['Swift', 'Baleno', 'Dzire', 'Ertiga'], mrp: 1800 },

  // ── Gates — Belts & Hoses ──
  { id: 'CAT-050', partName: 'Timing Belt', partNumber: 'GT-5521XS', brand: 'Gates', category: 'Belts & Hoses', vehicleCompatibility: ['i20', 'Verna', 'Creta', 'Venue'], mrp: 800 },
  { id: 'CAT-051', partName: 'Alternator Belt', partNumber: 'GT-6PK1070', brand: 'Gates', category: 'Belts & Hoses', vehicleCompatibility: ['i20', 'Verna', 'Creta'], mrp: 450 },
  { id: 'CAT-052', partName: 'AC Belt', partNumber: 'GT-4PK890', brand: 'Gates', category: 'Belts & Hoses', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], mrp: 380 },
  { id: 'CAT-053', partName: 'Radiator Hose - Upper', partNumber: 'GT-RH-3427', brand: 'Gates', category: 'Belts & Hoses', vehicleCompatibility: ['Swift 2011-2017', 'Dzire 2012-2017'], mrp: 600 },
  { id: 'CAT-054', partName: 'Radiator Hose - Lower', partNumber: 'GT-RH-3428', brand: 'Gates', category: 'Belts & Hoses', vehicleCompatibility: ['Swift 2011-2017', 'Dzire 2012-2017'], mrp: 550 },

  // ── Castrol — Oils & Fluids ──
  { id: 'CAT-055', partName: 'Engine Oil 5W-30 (1L)', partNumber: 'CST-5W30-1L', brand: 'Castrol', category: 'Oils & Fluids', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'WagonR', 'Alto K10', 'i20', 'Creta'], mrp: 500 },
  { id: 'CAT-056', partName: 'Engine Oil 5W-30 (3.5L)', partNumber: 'CST-5W30-3.5L', brand: 'Castrol', category: 'Oils & Fluids', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'i20', 'Creta', 'Seltos'], mrp: 1600 },
  { id: 'CAT-057', partName: 'Gear Oil EP90 (1L)', partNumber: 'CST-EP90-1L', brand: 'Castrol', category: 'Oils & Fluids', vehicleCompatibility: ['Swift', 'Dzire', 'Alto', 'WagonR', 'Eeco'], mrp: 400 },

  // ── Motul — Oils & Fluids ──
  { id: 'CAT-058', partName: 'Coolant 1L', partNumber: 'MOT-INUGEL', brand: 'Motul', category: 'Oils & Fluids', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'i20', 'Creta', 'Verna'], mrp: 280 },
  { id: 'CAT-059', partName: 'Brake Fluid DOT4 (500ml)', partNumber: 'MOT-DOT4-500', brand: 'Motul', category: 'Oils & Fluids', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'i20', 'Creta', 'Seltos'], mrp: 220 },
  { id: 'CAT-060', partName: 'ATF Fluid (1L)', partNumber: 'MOT-ATF-1L', brand: 'Motul', category: 'Oils & Fluids', vehicleCompatibility: ['Creta AT', 'Seltos AT', 'i20 AT', 'Verna AT'], mrp: 600 },

  // ── Osram — Lighting ──
  { id: 'CAT-061', partName: 'Headlight Bulb H4', partNumber: 'OS-64193', brand: 'Osram', category: 'Lighting', vehicleCompatibility: ['Swift', 'Dzire', 'Alto', 'WagonR', 'Eeco'], mrp: 200 },
  { id: 'CAT-062', partName: 'Headlight Bulb H7', partNumber: 'OS-64210', brand: 'Osram', category: 'Lighting', vehicleCompatibility: ['i20', 'Verna', 'Creta'], mrp: 250 },
  { id: 'CAT-063', partName: 'Fog Lamp Bulb H11', partNumber: 'OS-64211', brand: 'Osram', category: 'Lighting', vehicleCompatibility: ['Swift', 'Baleno', 'Creta', 'Seltos'], mrp: 300 },
  { id: 'CAT-064', partName: 'LED Headlight Bulb H4', partNumber: 'OS-LED-H4', brand: 'Osram', category: 'Lighting', vehicleCompatibility: ['Swift', 'Dzire', 'WagonR', 'Alto'], mrp: 1200 },

  // ── Amaron — Battery ──
  { id: 'CAT-065', partName: 'Battery 12V 35Ah', partNumber: 'AMR-PRO-35', brand: 'Amaron', category: 'Electrical', vehicleCompatibility: ['Alto', 'WagonR', 'Alto K10', 'S-Presso'], mrp: 3200 },
  { id: 'CAT-066', partName: 'Battery 12V 45Ah', partNumber: 'AMR-PRO-45', brand: 'Amaron', category: 'Electrical', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'i20'], mrp: 4200 },
  { id: 'CAT-067', partName: 'Battery 12V 65Ah', partNumber: 'AMR-PRO-65', brand: 'Amaron', category: 'Electrical', vehicleCompatibility: ['Creta', 'Seltos', 'Hector', 'Harrier', 'XUV700'], mrp: 5000 },

  // ── Anchor — Engine Mountings ──
  { id: 'CAT-068', partName: 'Front Engine Mounting', partNumber: 'ANC-9445', brand: 'Anchor', category: 'Engine Mounting', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'front', mrp: 850 },
  { id: 'CAT-069', partName: 'Rear Engine Mounting', partNumber: 'ANC-9446', brand: 'Anchor', category: 'Engine Mounting', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno'], position: 'rear', mrp: 750 },
  { id: 'CAT-070', partName: 'Gearbox Mounting', partNumber: 'ANC-9450', brand: 'Anchor', category: 'Engine Mounting', vehicleCompatibility: ['Swift', 'Dzire', 'Ertiga'], mrp: 900 },

  // ── Moog — Suspension (premium) ──
  { id: 'CAT-071', partName: 'Lower Ball Joint', partNumber: 'MOOG-K500252', brand: 'Moog', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos', 'i20'], position: 'front', mrp: 1200 },
  { id: 'CAT-072', partName: 'Stabilizer Link - Front', partNumber: 'MOOG-K750612', brand: 'Moog', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos', 'Verna'], position: 'front', mrp: 850 },
  { id: 'CAT-073', partName: 'Track Control Arm - LH', partNumber: 'MOOG-RK620745', brand: 'Moog', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos'], position: 'front', side: 'left', mrp: 3200 },
  { id: 'CAT-074', partName: 'Track Control Arm - RH', partNumber: 'MOOG-RK620746', brand: 'Moog', category: 'Suspension Parts', vehicleCompatibility: ['Creta', 'Seltos'], position: 'front', side: 'right', mrp: 3200 },

  // ── Mikuni / Rolon — Two-wheeler (cross-sell) ──
  { id: 'CAT-075', partName: 'Carburetor Kit', partNumber: 'MK-VM26-606', brand: 'Mikuni', category: 'Engine', vehicleCompatibility: ['Splendor', 'Passion', 'HF Deluxe'], mrp: 1100 },
  { id: 'CAT-076', partName: 'Chain Sprocket Set', partNumber: 'RLN-428H', brand: 'Rolon', category: 'Engine', vehicleCompatibility: ['Splendor', 'Passion', 'Pulsar 150'], mrp: 1300 },

  // ── Mann Filter ──
  { id: 'CAT-077', partName: 'Air Filter', partNumber: 'MF-C3875', brand: 'Mann Filter', category: 'Filters', vehicleCompatibility: ['Swift', 'Dzire 2017-2024', 'Baleno'], mrp: 300 },
  { id: 'CAT-078', partName: 'Oil Filter', partNumber: 'MF-W67/1', brand: 'Mann Filter', category: 'Filters', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ciaz', 'Ertiga'], mrp: 200 },
  { id: 'CAT-079', partName: 'Fuel Filter (Diesel)', partNumber: 'MF-WK820/17', brand: 'Mann Filter', category: 'Filters', vehicleCompatibility: ['Creta Diesel', 'Seltos Diesel', 'XUV300 Diesel'], mrp: 450 },
  { id: 'CAT-080', partName: 'Cabin Air Filter', partNumber: 'MF-CUK2436', brand: 'Mann Filter', category: 'Filters', vehicleCompatibility: ['Swift', 'Dzire', 'Baleno', 'Ignis'], mrp: 380 },
];
