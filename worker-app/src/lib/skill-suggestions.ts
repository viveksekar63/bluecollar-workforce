const SKILL_RULES: Array<{ keywords: string[]; skills: string[] }> = [
  {
    keywords: ['tea master', 'tea', 'chai', 'beverage', 'cafe', 'coffee'],
    skills: ['Tea Making', 'Coffee Making', 'Beverage Preparation', 'Customer Service', 'Kitchen Hygiene'],
  },
  {
    keywords: ['parotta', 'paratha', 'roti', 'chapati', 'naan'],
    skills: ['Parotta Making', 'Roti Making', 'Dough Preparation', 'Tawa Cooking', 'Kitchen Hygiene'],
  },
  {
    keywords: ['cook', 'cooking', 'chef', 'kitchen', 'restaurant', 'hotel', 'food'],
    skills: ['Cooking', 'Food Preparation', 'Kitchen Hygiene', 'Food Safety', 'Inventory Management'],
  },
  {
    keywords: ['waiter', 'server', 'restaurant service', 'hospitality'],
    skills: ['Customer Service', 'Table Service', 'Order Taking', 'Food Safety', 'Communication'],
  },
  {
    keywords: ['driver', 'driving', 'delivery', 'cab', 'auto', 'lorry', 'truck'],
    skills: ['Driving', 'Road Safety', 'Navigation', 'Vehicle Maintenance', 'Delivery Handling'],
  },
  {
    keywords: ['electrician', 'electrical', 'wiring'],
    skills: ['Electrical Wiring', 'Electrical Safety', 'Troubleshooting', 'Installation', 'Maintenance'],
  },
  {
    keywords: ['plumber', 'plumbing', 'pipe'],
    skills: ['Plumbing', 'Pipe Fitting', 'Leak Repair', 'Maintenance', 'Safety'],
  },
  {
    keywords: ['carpenter', 'carpentry', 'wood'],
    skills: ['Carpentry', 'Wood Cutting', 'Furniture Assembly', 'Measuring', 'Power Tools'],
  },
  {
    keywords: ['mason', 'construction', 'brick', 'concrete', 'building'],
    skills: ['Masonry', 'Brick Work', 'Concrete Work', 'Construction Safety', 'Site Work'],
  },
  {
    keywords: ['security', 'guard', 'watchman'],
    skills: ['Security', 'Access Control', 'Patrolling', 'Incident Reporting', 'Surveillance'],
  },
  {
    keywords: ['cleaner', 'cleaning', 'housekeeping'],
    skills: ['Cleaning', 'Housekeeping', 'Sanitation', 'Chemical Safety', 'Time Management'],
  },
  {
    keywords: ['tailor', 'tailoring', 'stitching', 'garment'],
    skills: ['Tailoring', 'Stitching', 'Pattern Cutting', 'Alterations', 'Garment Finishing'],
  },
];

export const PREDEFINED_SKILLS = [
  'Cooking',
  'Food Preparation',
  'Customer Service',
  'Driving',
  'Electrical Wiring',
  'Plumbing',
  'Carpentry',
  'Masonry',
  'Cleaning',
  'Housekeeping',
  'Security',
  'Tailoring',
  'Communication',
  'Inventory Management',
  'Safety',
];

export function getSmartSkillSuggestions(title: string, description: string, query = '') {
  const context = `${title} ${description}`.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const inferred: string[] = [];

  for (const rule of SKILL_RULES) {
    if (rule.keywords.some((keyword) => context.includes(keyword))) {
      inferred.push(...rule.skills);
    }
  }

  const base = [...new Set([...inferred, ...PREDEFINED_SKILLS])];
  if (!normalizedQuery) return base.slice(0, 10);

  return base
    .filter((skill) => skill.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);
}

export function addSkillToCsv(current: string, skill: string) {
  const existing = current
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (existing.some((item) => item.toLowerCase() === skill.toLowerCase())) return current;
  return [...existing, skill].join(', ');
}
