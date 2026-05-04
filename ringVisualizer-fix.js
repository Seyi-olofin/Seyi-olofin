// Solution for clamping qualified leads expansion within 5 radius on final page
// while keeping stats updated in real-time

// In your updateRingVisualizer function, replace the existing clamp logic with this:

function updateRingVisualizer(state, { skipLabelPositioning = false, skipRings = false } = {}) {
  // ... your existing code ...

  // Calculate radii as normal
  let localRadii = {
    expectedLeads: baseRadius,
    qualifiedLeads: baseRadius * (qualifiedPercent / 100),
    bookedDemos: baseRadius * (qualifiedPercent / 100) * (bookedPercent / 100),
    closedDeals: baseRadius * (qualifiedPercent / 100) * (bookedPercent / 100) * (closedPercent / 100)
  };

  // IMPROVED: Clamp ring expansion on final page with specific qualified leads limit
  if (state.page === 'final-page') {
    // Specifically clamp qualified leads to 5 radius maximum
    const QUALIFIED_LEADS_MAX_RADIUS = 5;
    localRadii.qualifiedLeads = Math.min(localRadii.qualifiedLeads, QUALIFIED_LEADS_MAX_RADIUS);
    
    // For other rings, apply proportional scaling based on the clamped qualified leads
    const qualifiedLeadsScale = localRadii.qualifiedLeads / (baseRadius * (qualifiedPercent / 100));
    
    // Apply scaling to dependent rings while preserving hierarchy
    localRadii.bookedDemos = Math.min(
      localRadii.bookedDemos * qualifiedLeadsScale, 
      localRadii.qualifiedLeads * 0.9 // ensure it stays within qualified leads
    );
    
    localRadii.closedDeals = Math.min(
      localRadii.closedDeals * qualifiedLeadsScale,
      localRadii.bookedDemos * 0.9 // ensure it stays within booked demos
    );
    
    // Expected leads can still use the general scaling
    localRadii.expectedLeads = Math.min(localRadii.expectedLeads, baseRadius * 0.8);
  }

  // Ensure proper ring hierarchy (unchanged)
  localRadii.qualifiedLeads = Math.min(localRadii.qualifiedLeads, localRadii.expectedLeads - 0.2);
  localRadii.bookedDemos = Math.min(localRadii.bookedDemos, localRadii.qualifiedLeads - 0.2);
  localRadii.closedDeals = Math.min(localRadii.closedDeals, localRadii.bookedDemos - 0.2);
  Object.keys(localRadii).forEach(key => { localRadii[key] = Math.max(localRadii[key], 0.3); });

  // Store globally for resize function access
  radii = localRadii;

  // IMPORTANT: Keep stats calculation separate from visual clamping
  // Use original unclamped values for stats updates
  const statsValues = {
    expectedLeads: expected,
    qualifiedLeads: Math.max((qualifiedPercent / 100) * expected, 1),
    bookedDemos: Math.max((bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1),
    closedDeals: Math.max((closedPercent / 100) * (bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1)
  };

  // ... rest of your ring creation code using localRadii for visuals ...
  
  // When updating labels, use statsValues instead of localRadii for real-time stats
  if (labelsVisible) {
    const label = document.createElement('div');
    // ... label setup ...
    label.innerHTML = `
      <div style="font-size: 10px; font-weight: 600; color: white; opacity: 0.8;">
        ${labelMap[centeredRing]}
      </div>
      <div style="font-size: 14px; font-weight: 800; color: ${colors[centeredRing]};">
        ${Math.round(statsValues[centeredRing])}  <!-- Use statsValues here -->
      </div>`;
    // ... rest of label code ...
  }

  // ... rest of your function ...
}

// Alternative approach: Create a separate function for stats calculation
function calculateRealTimeStats(state) {
  const expected = Math.max(state.expectedLeads || 0, 1);
  const qualifiedPercent = state.qualifiedLeads || 0;
  const bookedPercent = state.bookedDemos || 0;
  const closedPercent = state.closedDeals || 0;

  return {
    expectedLeads: expected,
    qualifiedLeads: Math.max((qualifiedPercent / 100) * expected, 1),
    bookedDemos: Math.max((bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1),
    closedDeals: Math.max((closedPercent / 100) * (bookedPercent / 100) * (qualifiedPercent / 100) * expected, 1)
  };
}

// Usage in your ring creation loop:
const realTimeStats = calculateRealTimeStats(state);

ringOrder.forEach((key, i) => {
  const visualRadius = localRadii[key];  // Clamped radius for visual display
  const statValue = realTimeStats[key];  // Real unclamped value for stats
  
  if (!sliderTouched[key] || !statValue || statValue <= 0) return;

  // Create ring with visual radius
  const outer = Math.max(visualRadius, 0.3);
  // ... ring creation code ...

  // Update label with real stat value
  if (labelsVisible) {
    label.innerHTML = `
      <div style="font-size: 10px; font-weight: 600; color: white; opacity: 0.8;">
        ${labelMap[key]}
      </div>
      <div style="font-size: 14px; font-weight: 800; color: ${colors[key]};">
        ${Math.round(statValue)}  <!-- Real-time stat value -->
      </div>`;
  }
});