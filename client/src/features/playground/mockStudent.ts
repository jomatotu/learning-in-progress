import type { Profile } from '@/api/assess'

// Made-up demo student and their learning material, standing in for the intake step until it exists.
export const mockStudent: { profile: Profile; material: string } = {
  profile: {
    name: 'Peter',
    challenges: ['ADHD'],
    goals: 'Understand cell transport for the next biology test',
    interests: ['Minecraft', 'Football'],
  },
  material: `Biology, Grade 10: Transport Across Cell Membranes

1. Why cells need transport
Every cell must take in what it needs, such as oxygen, water, glucose, and ions, and get rid of waste, such as carbon dioxide and urea. All of these substances have to cross the cell membrane. Some cross without any help from the cell (passive transport). Others need the cell to spend energy (active transport).

2. The cell membrane
The cell membrane is made of a phospholipid bilayer: two layers of phospholipid molecules. Each phospholipid has a water-loving (hydrophilic) head and two water-fearing (hydrophobic) tails. The heads face the watery inside and outside of the cell, and the tails point towards each other in the middle. Proteins are embedded in this bilayer. Some of them form channels or carriers that let specific substances through. This structure is called the fluid mosaic model, because the molecules can move sideways like a fluid and the proteins are scattered through it like the pieces of a mosaic.

The membrane is selectively permeable. Small particles such as water, oxygen, and carbon dioxide can pass through it. Large or charged particles such as glucose or ions can only pass through certain transport proteins.

3. Diffusion
Particles in liquids and gases are always moving randomly (Brownian motion). Because of this, they spread out on their own from places of high concentration to places of low concentration, until the concentration is the same everywhere. The difference in concentration between two places is called the concentration gradient. Diffusion always goes down the concentration gradient and needs no energy from the cell.

Example: In the lungs, oxygen diffuses from the air sacs (alveoli), where its concentration is high, into the blood, where its concentration is low. Carbon dioxide diffuses the other way.

4. What changes the rate of diffusion
- Concentration gradient: the steeper the gradient, the faster the diffusion.
- Temperature: at higher temperatures, particles move faster, so diffusion is faster.
- Surface area: a larger surface lets more particles cross at the same time.
- Distance: the shorter the distance the particles must travel, the faster the diffusion.
- Particle size: small particles diffuse faster than large ones.

5. Surface area to volume ratio
As a cell gets bigger, its volume grows faster than its surface area. A large cell would have too little membrane to supply its whole volume by diffusion. This is one reason why cells stay small. Organs that exchange a lot of substances have a very large surface area: the lungs have millions of alveoli, and the small intestine is lined with tiny folds called villi.

6. Facilitated diffusion
Some particles, such as glucose and ions, cannot cross the phospholipid bilayer on their own. They diffuse through channel proteins or carrier proteins instead. This is called facilitated diffusion. Like normal diffusion, it goes down the concentration gradient and needs no energy.

7. Osmosis
Osmosis is the diffusion of water through a selectively permeable membrane. Water flows to the side with the higher concentration of dissolved particles (solutes).

- Hypotonic (fewer dissolved particles outside): Water flows into the cell. Red blood cells swell and can burst. Plant cells become firm (turgor).
- Isotonic (the same amount of dissolved particles): The cell stays the same.
- Hypertonic (more dissolved particles outside): Water flows out of the cell. Red blood cells shrink. In plant cells, the cell contents pull away from the cell wall (plasmolysis).

Plant cells don't burst in a hypotonic solution, because their strong cell wall stops them from swelling too much. The pressure of the cell contents against the wall is called turgor pressure, and it keeps plants upright. When plants lose too much water, turgor pressure drops and they wilt.

Example: Salt on cucumber slices makes the solution outside hypertonic. Water leaves the cucumber, and it goes soft.

8. Active transport
Sometimes a cell needs to move particles against the concentration gradient: from a low concentration to a high one. This is called active transport. It uses carrier proteins, often called pumps, and needs energy in the form of ATP, which the cell makes during respiration in the mitochondria.

Examples:
- Root hair cells take up mineral ions from the soil, even though the concentration of ions is higher inside the root than in the soil.
- The sodium-potassium pump moves sodium ions out of nerve cells and potassium ions in. This is needed for nerve signals.
- Cells in the small intestine absorb glucose from digested food by active transport, so no glucose is left behind.

9. Bulk transport
Very large particles, such as proteins or whole bacteria, are too big for transport proteins. Cells move them in membrane bubbles called vesicles. This also needs energy.
- Endocytosis: the membrane folds around a particle and pinches off to bring it into the cell. White blood cells swallow bacteria this way (phagocytosis).
- Exocytosis: a vesicle inside the cell fuses with the membrane and releases its contents outside. Cells in the pancreas release the hormone insulin this way.

10. Comparing the types of transport
- Diffusion: down the gradient, no energy, no proteins needed.
- Facilitated diffusion: down the gradient, no energy, uses channel or carrier proteins.
- Osmosis: water only, down the water gradient, no energy, through a selectively permeable membrane.
- Active transport: against the gradient, needs energy (ATP), uses carrier proteins (pumps).
- Bulk transport: large particles in vesicles, needs energy.

11. Why it matters
Cells must keep the amount of water and dissolved substances inside them constant (homeostasis). If the balance is lost, cells can swell, shrink, or stop working. That is why patients are given an isotonic saline solution (0.9%) as an IV drip: it has the same concentration as blood, so their blood cells neither swell nor shrink.`,
}
