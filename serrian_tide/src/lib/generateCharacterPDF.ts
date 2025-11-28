import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Character = {
  characterName: string;
  playerName?: string | null;
  campaignName?: string | null;
  race?: string | null;
  age?: number | null;
  baseMagic?: number | null;
  baseMovement?: number | null;
  sex?: string | null;
  height?: number | null;
  weight?: number | null;
  skinColor?: string | null;
  eyeColor?: string | null;
  hairColor?: string | null;
  deity?: string | null;
  fame?: number | null;
  experience?: number | null;
  totalExperience?: number | null;
  quintessence?: number | null;
  totalQuintessence?: number | null;
  definingMarks?: string | null;
  strength?: number | null;
  dexterity?: number | null;
  constitution?: number | null;
  intelligence?: number | null;
  wisdom?: number | null;
  charisma?: number | null;
  skill_allocations?: Record<string, number> | null;
  personality?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  goals?: string | null;
  secrets?: string | null;
  backstory?: string | null;
  motivations?: string | null;
  hooks?: string | null;
};

type Skill = {
  id: string;
  name: string;
  primaryAttribute: string;
  tier: number | null;
  type: string;
};

export function generateCharacterPDF(character: Character, skills: Skill[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Parchment background color
  doc.setFillColor(245, 235, 210);
  doc.rect(0, 0, 216, 279, 'F');

  // Title - "Character Record Sheet"
  doc.setTextColor(180, 30, 30); // Red color
  doc.setFontSize(28);
  doc.setFont('times', 'bold');
  doc.text('Character Record Sheet', 108, 15, { align: 'center' });

  // Reset to black for rest of document
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let yPos = 25;

  // Header Info Section
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  
  // Row 1: Player Name, Character Name, Campaign
  const row1Y = yPos;
  doc.rect(10, row1Y, 65, 7);
  doc.rect(75, row1Y, 65, 7);
  doc.rect(140, row1Y, 60, 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Player Name:', 11, row1Y + 3);
  doc.text('Character Name:', 76, row1Y + 3);
  doc.text('Campaign:', 141, row1Y + 3);
  
  doc.setFont('helvetica', 'normal');
  doc.text(character.playerName || '', 11, row1Y + 6);
  doc.text(character.characterName || '', 76, row1Y + 6);
  doc.text(character.campaignName || '', 141, row1Y + 6);

  yPos += 7;

  // Row 2: Race, Age, Base Magic, Base Movement, Sex, Height, Weight
  const row2Y = yPos;
  doc.rect(10, row2Y, 25, 7);
  doc.rect(35, row2Y, 15, 7);
  doc.rect(50, row2Y, 25, 7);
  doc.rect(75, row2Y, 25, 7);
  doc.rect(100, row2Y, 20, 7);
  doc.rect(120, row2Y, 20, 7);
  doc.rect(140, row2Y, 30, 7);
  doc.rect(170, row2Y, 30, 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Race:', 11, row2Y + 3);
  doc.text('Age:', 36, row2Y + 3);
  doc.text('Base Magic:', 51, row2Y + 3);
  doc.text('Base Movement:', 76, row2Y + 3);
  doc.text('Sex:', 101, row2Y + 3);
  doc.text('Height:', 121, row2Y + 3);
  doc.text('Weight:', 141, row2Y + 3);

  doc.setFont('helvetica', 'normal');
  doc.text(character.race || '', 11, row2Y + 6);
  doc.text(character.age?.toString() || '', 36, row2Y + 6);
  doc.text(character.baseMagic?.toString() || '', 51, row2Y + 6);
  doc.text(character.baseMovement?.toString() || '', 76, row2Y + 6);
  doc.text(character.sex || '', 101, row2Y + 6);
  doc.text(character.height?.toString() || '', 121, row2Y + 6);
  doc.text(character.weight?.toString() || '', 141, row2Y + 6);

  yPos += 7;

  // Row 3: Skin Color, Hair Color, Eye Color, Deity, Fame
  const row3Y = yPos;
  doc.rect(10, row3Y, 35, 7);
  doc.rect(45, row3Y, 35, 7);
  doc.rect(80, row3Y, 35, 7);
  doc.rect(115, row3Y, 35, 7);
  doc.rect(150, row3Y, 50, 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Skin Color:', 11, row3Y + 3);
  doc.text('Hair Color:', 46, row3Y + 3);
  doc.text('Eye Color:', 81, row3Y + 3);
  doc.text('Deity:', 116, row3Y + 3);
  doc.text('Fame:', 151, row3Y + 3);

  doc.setFont('helvetica', 'normal');
  doc.text(character.skinColor || '', 11, row3Y + 6);
  doc.text(character.hairColor || '', 46, row3Y + 6);
  doc.text(character.eyeColor || '', 81, row3Y + 6);
  doc.text(character.deity || '', 116, row3Y + 6);
  doc.text(character.fame?.toString() || '0', 151, row3Y + 6);

  yPos += 7;

  // Row 4: Experience, Total Experience, Quintessence, Total Quintessence, Fate
  const row4Y = yPos;
  doc.rect(10, row4Y, 40, 7);
  doc.rect(50, row4Y, 40, 7);
  doc.rect(90, row4Y, 40, 7);
  doc.rect(130, row4Y, 45, 7);
  doc.rect(175, row4Y, 25, 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Experience:', 11, row4Y + 3);
  doc.text('Total Experience:', 51, row4Y + 3);
  doc.text('Quintessence:', 91, row4Y + 3);
  doc.text('Total Quintessence:', 131, row4Y + 3);
  doc.text('Fate:', 176, row4Y + 3);

  doc.setFont('helvetica', 'normal');
  doc.text(character.experience?.toString() || '0', 11, row4Y + 6);
  doc.text(character.totalExperience?.toString() || '0', 51, row4Y + 6);
  doc.text(character.quintessence?.toString() || '0', 91, row4Y + 6);
  doc.text(character.totalQuintessence?.toString() || '0', 131, row4Y + 6);
  doc.text('', 176, row4Y + 6);

  yPos += 7;

  // Defining Marks section
  const marksY = yPos;
  doc.rect(10, marksY, 190, 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Defining Marks & Character Quirks:', 11, marksY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const marksText = character.definingMarks || '';
  const splitMarks = doc.splitTextToSize(marksText, 185);
  doc.text(splitMarks.slice(0, 2), 11, marksY + 8);

  yPos += 17;

  // Main content area with 3 columns
  const col1X = 10;
  const col2X = 75;
  const col3X = 140;
  const colWidth = 60;

  // COLUMN 1: Attributes
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Attributes', col1X + 20, yPos);
  yPos += 5;

  const calcMod = (val: number) => {
    if (val >= 50) return Math.floor((val - 50) / 2);
    return -Math.floor((50 - val) / 2);
  };

  const attributes = [
    { name: 'Strength', value: character.strength || 25 },
    { name: 'Dexterity', value: character.dexterity || 25 },
    { name: 'Constitution', value: character.constitution || 25 },
    { name: 'Intelligence', value: character.intelligence || 25 },
    { name: 'Wisdom', value: character.wisdom || 25 },
    { name: 'Charisma', value: character.charisma || 25 }
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['', '#', 'Mod', '%']],
    body: attributes.map(attr => [
      attr.name,
      attr.value.toString(),
      calcMod(attr.value).toString(),
      ''
    ]),
    theme: 'grid',
    margin: { left: col1X, right: 135 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 10, halign: 'center' }
    }
  });

  // COLUMN 2: Hit Points & Mana
  let col2Y = yPos;
  doc.setFont('helvetica', 'bold');
  doc.text('Hit Points', col2X + 15, col2Y);
  col2Y += 5;

  autoTable(doc, {
    startY: col2Y,
    head: [['Location', 'Total HP', 'Damage']],
    body: [
      ['Head', '', ''],
      ['Chest', '', ''],
      ['R Arm', '', ''],
      ['L Arm', '', ''],
      ['R Leg', '', ''],
      ['L Leg', '', '']
    ],
    theme: 'grid',
    margin: { left: col2X, right: 75 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 }
    }
  });

  // COLUMN 3: Base Initiative & Currencies
  let col3Y = yPos;
  doc.setFont('helvetica', 'bold');
  doc.text('Base Initiative', col3X + 10, col3Y);
  col3Y += 5;

  doc.rect(col3X, col3Y, colWidth, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('', col3X + 25, col3Y + 7);

  col3Y += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Manna/Chi', col3X + 15, col3Y);
  col3Y += 5;
  
  autoTable(doc, {
    startY: col3Y,
    head: [['Used', 'Total']],
    body: [['', '']],
    theme: 'grid',
    margin: { left: col3X, right: 15 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, minCellHeight: 15 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 }
    }
  });

  col3Y += 25;
  doc.setFont('helvetica', 'bold');
  doc.text('Currencies', col3X + 15, col3Y);
  col3Y += 5;
  
  autoTable(doc, {
    startY: col3Y,
    body: [[''], [''], [''], ['']],
    theme: 'grid',
    margin: { left: col3X, right: 15 },
    bodyStyles: { fontSize: 8, minCellHeight: 8 },
    columnStyles: {
      0: { cellWidth: 60 }
    }
  });

  // Weapons section
  yPos = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Weapon', 12, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['Type', 'Range', 'Durability', '%', 'Damage', 'Mod', 'Total Damage']],
    body: Array(5).fill(['', '', '', '', '', '', '']),
    theme: 'grid',
    margin: { left: 10, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 }
    }
  });

  // Armor section
  yPos = 165;
  doc.setFont('helvetica', 'bold');
  doc.text('Armor', 12, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['Area Covered', 'Special Properties', 'Durability', 'Soaks']],
    body: Array(5).fill(['', '', '', '']),
    theme: 'grid',
    margin: { left: 10, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 80 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    }
  });

  // Status Effects section with body diagram
  yPos = 210;
  doc.setFont('helvetica', 'bold');
  doc.text('Status Effects', 12, yPos);
  doc.rect(10, yPos + 2, 140, 30);

  // Simple body diagram placeholder
  doc.setDrawColor(200, 50, 50);
  doc.setLineWidth(2);
  // Head
  doc.circle(175, yPos + 8, 5);
  // Body
  doc.rect(170, yPos + 13, 10, 15);
  // Arms
  doc.line(170, yPos + 15, 160, yPos + 20);
  doc.line(180, yPos + 15, 190, yPos + 20);
  // Legs
  doc.line(173, yPos + 28, 168, yPos + 38);
  doc.line(177, yPos + 28, 182, yPos + 38);
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Most Common Used Skills section
  yPos = 242;
  doc.setFont('helvetica', 'bold');
  doc.text('Most Common Used Skills and Rolls', 12, yPos);
  doc.rect(10, yPos + 2, 190, 25);

  // PAGE 2 - Skills
  doc.addPage();
  doc.setFillColor(245, 235, 210);
  doc.rect(0, 0, 216, 279, 'F');

  yPos = 15;

  // General Skills Section (two columns)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Skill', 12, yPos);
  doc.text('Skill', 110, yPos);

  // Get skills from character
  const skillsList = skills.filter(s => s.tier === 1 && s.type !== 'magic' && s.type !== 'special ability');
  const halfLength = Math.ceil(skillsList.length / 2);
  const leftSkills = skillsList.slice(0, halfLength);
  const rightSkills = skillsList.slice(halfLength);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: leftSkills.map(skill => [
      skill.name,
      character.skill_allocations?.[skill.id] || '',
      '',
      ''
    ]),
    theme: 'grid',
    margin: { left: 10, right: 108 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: rightSkills.map(skill => [
      skill.name,
      character.skill_allocations?.[skill.id] || '',
      '',
      ''
    ]),
    theme: 'grid',
    margin: { left: 108, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  yPos = 100;

  // Magic Spheres Section
  doc.setFont('helvetica', 'bold');
  doc.text('Sphere', 12, yPos);
  doc.text('Spell', 110, yPos);

  const spheres = ['Fire', 'Earth', 'Wind', 'Water', 'Soul', 'Life', 'Death', 
                   'Enchantment', 'Charm', 'Transmutation', 'Transformation', 
                   'Summoning', 'Illusion', 'Divination', 'Time & Space', 'Negation'];

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: spheres.map(sphere => [sphere, '', '', '']),
    theme: 'grid',
    margin: { left: 10, right: 108 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: spheres.map(() => ['', '', '', '']),
    theme: 'grid',
    margin: { left: 108, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  yPos = 185;

  // Psionic Discipline Section
  doc.setFont('helvetica', 'bold');
  doc.text('Psionic Discipline', 12, yPos);
  doc.text('Psionic Skill', 110, yPos);

  const psionicDisciplines = ['Mental', 'Physical', 'Kinetic'];

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: psionicDisciplines.map(disc => [disc, '', '', '']),
    theme: 'grid',
    margin: { left: 10, right: 108 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', 'Rank', '%']],
    body: psionicDisciplines.map(() => ['', '', '', '']),
    theme: 'grid',
    margin: { left: 108, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 }
    }
  });

  yPos = 220;

  // Special Abilities Section
  doc.setFont('helvetica', 'bold');
  doc.text('Special Ability', 12, yPos);
  doc.text('Special Ability', 110, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', '%']],
    body: Array(3).fill(['', '', '']),
    theme: 'grid',
    margin: { left: 10, right: 108 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 }
    }
  });

  autoTable(doc, {
    startY: yPos + 2,
    head: [['', '#', '%']],
    body: Array(3).fill(['', '', '']),
    theme: 'grid',
    margin: { left: 108, right: 10 },
    headStyles: { fillColor: [220, 210, 190], textColor: 0, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 }
    }
  });

  yPos = 250;

  // Inventory Section
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory', 12, yPos);
  doc.rect(10, yPos + 2, 190, 20);

  // Save PDF
  const fileName = `${character.characterName || 'Character'}_Sheet.pdf`;
  doc.save(fileName);
}
