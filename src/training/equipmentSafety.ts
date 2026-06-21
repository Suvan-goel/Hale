import type { AvailableEquipment } from '../adherence';
import type { EquipmentTag } from '../movements';

type RequiredEquipmentTag = EquipmentTag | string;

export function hasSupportEquipment(available: readonly AvailableEquipment[]): boolean {
  return available.includes('chair') || available.includes('wall');
}

export function equipmentSupportsTags(
  required: readonly RequiredEquipmentTag[],
  available: readonly AvailableEquipment[]
): boolean {
  return equipmentMissingLabels(required, available).length === 0;
}

export function equipmentMissingLabels(
  required: readonly RequiredEquipmentTag[],
  available: readonly AvailableEquipment[]
): string[] {
  const labels: string[] = [];
  for (const tag of required) {
    const label = missingLabelForTag(tag, available);
    if (label && !labels.includes(label)) labels.push(label);
  }
  return labels;
}

export function equipmentLabels(tags: readonly RequiredEquipmentTag[]): string[] {
  const labels: string[] = [];
  for (const tag of tags) {
    const label = displayLabelForTag(tag);
    if (label && !labels.includes(label)) labels.push(label);
  }
  return labels;
}

export function equipmentLabel(tags: readonly RequiredEquipmentTag[]): string {
  return humanList(equipmentLabels(tags)) || 'No optional equipment';
}

export function humanList(items: readonly string[]): string {
  const clean = unique(items.filter(Boolean));
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

function missingLabelForTag(tag: RequiredEquipmentTag, available: readonly AvailableEquipment[]): string | null {
  if (tag === 'none') return null;
  if (tag === 'floor') return available.includes('floor_space') ? null : 'floor space marked safe for floor exercises';
  if (tag === 'cushion') return available.includes('chair') ? null : 'a stable chair';
  if (tag === 'chair') return available.includes('chair') ? null : 'a stable chair';
  if (tag === 'wall') return available.includes('wall') ? null : 'wall or counter support';
  if (tag === 'counter') return hasSupportEquipment(available) ? null : 'wall or counter support';
  if (tag === 'stair') return available.includes('stairs') ? null : 'a bottom stair';
  if (tag === 'long_band' || tag === 'band') {
    return available.includes('resistance_band') ? null : 'a resistance band';
  }
  if (tag === 'door_anchor') return available.includes('door_anchor') ? null : 'a door anchor';
  if (tag === 'mini_band') return available.includes('mini_band') ? null : 'a mini band';
  if (tag === 'backpack_or_weight') {
    return available.includes('backpack') || available.includes('dumbbells')
      ? null
      : 'a backpack or light weight';
  }
  return null;
}

function displayLabelForTag(tag: RequiredEquipmentTag): string | null {
  if (tag === 'none') return null;
  if (tag === 'floor') return 'floor space';
  if (tag === 'chair') return 'chair';
  if (tag === 'cushion') return 'cushion';
  if (tag === 'wall' || tag === 'counter') return 'wall or counter support';
  if (tag === 'stair') return 'bottom stair';
  if (tag === 'long_band' || tag === 'band') return 'resistance band';
  if (tag === 'door_anchor') return 'door anchor';
  if (tag === 'mini_band') return 'mini band';
  if (tag === 'backpack_or_weight') return 'backpack or light weight';
  return String(tag).replace(/_/g, ' ');
}

function unique<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
