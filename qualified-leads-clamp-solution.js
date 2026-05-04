/*
SOLUTION: Clamp qualified leads within 5 radius on final page while keeping stats real-time

PROBLEM: Your current code applies a blanket 0.8 scaling to all rings on final page,
but you want to specifically limit qualified leads to 5 radius maximum while keeping
the actual statistical values updating in real-time.

CHANGES NEEDED:
*/

// 1. Replace your existing clamp logic (around line 600-650 in your code):

// BEFORE (your current code):
if (state.page === 'final-page') {
  Object.keys(localRadii).forEach(key => {
    localRadii[key] = Math.min(localRadii[key], baseRadius * 0.8);
  });
}

// AFTER (improved solution):
if (state.page === 'final-page') {
  // Specifically clamp qualified leads to 5 radius maximum
  const QUALIFIED_LEADS_MAX_RADIUS = 5;
  
  // Store original values for stats calculation
  const originalQualifiedRadius = localRadii.qualifiedLeads;
  
  // Apply the clamp to qualified leads
  localRadii.qualifiedLeads = Math.min(localRadii.qualifiedLeads, QUALIFIED_LEADS_MAX_RADIUS);
  
  // Calculate the scale factor to maintain proportions for dependent rings
  const scaleFactorForDependents = originalQualifiedRadius > 0 
    ? localRadii.qualifiedLeads / originalQualifiedRadius 
    : 1;
  
  // Apply proportional scaling to rings that depend on qualified leads
  localRadii.bookedDemos = localRadii.bookedDemos * scaleFactorForDependents;
  localRadii.closedDeals = localRadii.closedDeals * scaleFactorForDependents;
  
  // Expected leads can still use general scaling if needed
  localRadii.expectedLeads = Math.min(localRadii.expectedLeads, baseRadius * 0.8);
}

// 2. Separate visual radii from statistical values:

// Add this RIGHT AFTER your localRadii calculation and BEFORE the final page clamp:
const statsValues = {
  expectedLeads: expected,
  qualifiedLeads: Math.max((qualifiedPercent / 100) * expected, 1),
  bookedDemos: Math.max((bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1),
  closedDeals: Math.max((closedPercent / 100) * (bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1)
};

// 3. Update your ring creation code to use statsValues for labels:

// In your ring creation loop, replace this:
label.innerHTML = `
  <div style="font-size: 10px; font-weight: 600; color: white; opacity: 0.8;">
    ${labelMap[centeredRing]}
  </div>
  <div style="font-size: 14px; font-weight: 800; color: ${colors[centeredRing]};">
    ${Math.round(values[centeredRing])}
  </div>`;

// With this:
label.innerHTML = `
  <div style="font-size: 10px; font-weight: 600; color: white; opacity: 0.8;">
    ${labelMap[centeredRing]}
  </div>
  <div style="font-size: 14px; font-weight: 800; color: ${colors[centeredRing]};">
    ${Math.round(statsValues[centeredRing])}
  </div>`;

// 4. Do the same for your ringOrder.forEach loop:

ringOrder.forEach((key, i) => {
  const val = statsValues[key]; // Use statsValues instead of values[key]
  const visualRadius = localRadii[key]; // Use localRadii for visual positioning
  
  if (!sliderTouched[key] || !val || val <= 0) return;

  const outer = Math.max(visualRadius, 0.3); // Visual radius (clamped)
  const inner = Math.max(outer - ringThicknessMap[key], 0.05);

  // ... ring creation code ...

  if (labelsVisible) {
    // ... label setup ...
    label.innerHTML = `
      <div style="font-size: 10px; font-weight: 600; color: white; opacity: 0.8;">
        ${labelMap[key]}
      </div>
      <div style="font-size: 14px; font-weight: 800; color: ${colors[key]};">
        ${Math.round(val)}  <!-- Real-time stat value, not clamped -->
      </div>`;
    // ... rest of label code ...
  }
});

/*
SUMMARY:
- Visual rings use localRadii (clamped to 5 radius for qualified leads on final page)
- Label statistics use statsValues (real-time, unclamped values)
- This gives you the visual constraint you want while keeping stats accurate
*/