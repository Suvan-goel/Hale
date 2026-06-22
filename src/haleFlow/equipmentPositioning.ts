export interface ControlledBetaEquipmentPositioning {
  shortLabel: string;
  startingSetup: string;
  specialistEquipment: string;
  bandRecommendation: string;
  optionalSetup: string;
  noEquipmentClarification: string;
}

export const controlledBetaEquipmentPositioning: ControlledBetaEquipmentPositioning = {
  shortLabel: 'Minimal household setup',
  startingSetup: 'Start with a sturdy chair and a wall or counter for support.',
  specialistEquipment: 'No specialist gym equipment is needed to begin.',
  bandRecommendation: 'A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.',
  optionalSetup: 'Floor space, a low stable step, and a door anchor are used only when you confirm they are available.',
  noEquipmentClarification: 'Hale plans around what you have, but some movements may be unavailable without household support or a resistance band.',
};
