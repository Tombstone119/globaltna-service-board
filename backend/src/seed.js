require('dotenv').config();
const mongoose = require('mongoose');
const JobRequest = require('./models/JobRequest');

const SAMPLES = [
  {
    title: 'Leaking kitchen tap — needs replacement',
    description:
      "Single-lever mixer tap has been dripping for two weeks. Tried tightening but it's still going. Happy to source the tap myself — just need it swapped in. Stopcock is in the cupboard under the sink.",
    category: 'Plumbing',
    location: 'SW11 · Battersea',
    contactName: 'Helen Pratt',
    contactEmail: 'helen@example.com',
    status: 'Open',
  },
  {
    title: 'Two double sockets — living room',
    description:
      'Need two new double sockets installed on the same wall, behind the TV. Existing socket nearby to spur off. Plaster damage acceptable — repainting after.',
    category: 'Electrical',
    location: 'SW12 · Balham',
    contactName: 'Marcus Lee',
    contactEmail: 'marcus@example.com',
    status: 'Open',
  },
  {
    title: 'Paint two bedrooms (~30 m² total)',
    description:
      "Two bedrooms, walls only (no ceilings, no woodwork). I'll provide the paint — Farrow & Ball, two coats. Walls in good condition, just filling a couple of nail holes.",
    category: 'Painting',
    location: 'SW8 · Vauxhall',
    contactName: 'Anya Roth',
    contactEmail: 'anya@example.com',
    status: 'In Progress',
  },
  {
    title: 'Refit two cupboard doors + sticking drawer',
    description:
      'Two kitchen cupboard doors hanging crooked — hinges need adjusting or replacing. One drawer runner is sticking. Small job, probably under an hour.',
    category: 'Joinery',
    location: 'SW18 · Wandsworth',
    contactName: 'Joel Asante',
    contactEmail: 'joel@example.com',
    status: 'Open',
  },
  {
    title: 'Replace fluorescent strip with LED panel',
    description:
      'Old fluorescent tube in the garage utility room flickers. Want to replace with a flat LED ceiling panel.',
    category: 'Electrical',
    location: 'SW4 · Clapham',
    contactName: 'Priya Shah',
    contactEmail: 'priya@example.com',
    status: 'In Progress',
  },
  {
    title: 'Replaced bathroom extractor fan',
    description: 'Extractor fan replaced and tested. Completed Thursday.',
    category: 'Electrical',
    location: 'SW2 · Brixton',
    contactName: 'Yuki Tanaka',
    contactEmail: 'yuki@example.com',
    status: 'Closed',
  },
  {
    title: 'Hallway radiator — bleed and rebalance',
    description: 'Top of the radiator stays cold even with the heating on for an hour.',
    category: 'Plumbing',
    location: 'SW9 · Stockwell',
    contactName: 'Rob McKay',
    contactEmail: 'rob@example.com',
    status: 'Open',
  },
  {
    title: 'Fit new internal door + handle',
    description: 'Replacement door is on site, just needs hanging. Standard 762×1981 mm.',
    category: 'Joinery',
    location: 'SW15 · Putney',
    contactName: 'Eve Chen',
    contactEmail: 'eve@example.com',
    status: 'Open',
  },
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/globaltna';
  await mongoose.connect(uri);
  await JobRequest.deleteMany({});
  const inserted = await JobRequest.insertMany(SAMPLES);
  console.log(`Seeded ${inserted.length} jobs.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
