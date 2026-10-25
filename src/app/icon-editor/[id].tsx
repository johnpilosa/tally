import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';

import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { CustomIconView } from '@/icons/custom';
import {
  newShapeId,
  useCustomIcons,
  type CustomIcon,
  type Motion,
  type Shape,
  type ShapeKind,
} from '@/lib/custom-icons';

const C = Colors.dark;
const CANVAS = 260;
/** El lienzo de 100 × 100 ocupa este espacio dentro del círculo (igual que en el botón real). */
const INNER = CANVAS * 0.72;
const MAX_SHAPES = 12;

const KIND_OPTIONS: { value: ShapeKind; label: string }[] = [
  { value: 'circle', label: '○ CÍRCULO' },
  { value: 'square', label: '□ CUADRADO' },
  { value: 'triangle', label: '△ TRIÁNGULO' },
  { value: 'star', label: '☆ ESTRELLA' },
  { value: 'line', label: '— LÍNEA' },
];
const KIND_GLYPH: Record<ShapeKind, string> = {
  circle: '○',
  square: '□',
  triangle: '△',
  star: '☆',
  line: '—',
};
const MOTION_OPTIONS: { value: Motion; label: string }[] = [
  { value: 'none', label: 'NADA' },
  { value: 'spin', label: 'GIRAR' },
  { value: 'pulse', label: 'LATIR' },
  { value: 'float', label: 'FLOTAR' },
  { value: 'blink', label: 'PARPADEAR' },
  { value: 'orbit', label: 'ORBITAR' },
  { value: 'shake', label: 'TEMBLAR' },
  { value: 'bounce', label: 'SALTAR' },
];
const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
];
const DELAY_OPTIONS = [
  { value: 0, label: '0' },
  { value: 150, label: '150 MS' },
  { value: 300, label: '300 MS' },
  { value: 500, label: '500 MS' },
];

function newShape(kind: ShapeKind): Shape {
  return {
    id: newShapeId(),
    kind,
    x: 50,
    y: 50,
    size: kind === 'line' ? 50 : 36,
    rotation: 0,
    filled: false,
    color: 'white',
    motion: 'pulse',
    speed: 1,
    delay: 0,
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Editor de íconos propios: formas que se arrastran en el lienzo, cada una con su movimiento. */
export default function IconEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { icons, loaded } = useCustomIcons();
  // Se espera a que carguen los íconos guardados, para que al editar uno arranque con sus formas.
  if (!loaded) return <View style={styles.screen} />;
  const existing = icons.find((i) => i.id === id);
  return <IconEditor key={id} existing={existing} />;
}

function IconEditor({ existing }: { existing: CustomIcon | undefined }) {
  const { saveIcon, deleteIcon } = useCustomIcons();

  const [draft, setDraft] = useState<CustomIcon>(
    () => existing ?? { id: newShapeId(), name: '', shapes: [newShape('circle')] },
  );
  const [selectedId, setSelectedId] = useState<string | null>(draft.shapes[0]?.id ?? null);
  const [trigger, setTrigger] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const play = () => setTrigger((t) => t + 1);

  const selected = draft.shapes.find((s) => s.id === selectedId) ?? null;

  const updateShape = (changes: Partial<Shape>, preview = false) => {
    if (!selected) return;
    setDraft((d) => ({
      ...d,
      shapes: d.shapes.map((s) => (s.id === selected.id ? { ...s, ...changes } : s)),
    }));
    // Se reproduce un instante después, cuando la forma ya tiene su movimiento nuevo;
    // si se hace al mismo tiempo, la animación no alcanza a arrancar.
    if (preview) setTimeout(play, 50);
  };

  const addShape = (kind: ShapeKind) => {
    const shape = newShape(kind);
    setDraft((d) => ({ ...d, shapes: [...d.shapes, shape] }));
    setSelectedId(shape.id);
  };

  const duplicateShape = () => {
    if (!selected) return;
    const copy = { ...selected, id: newShapeId(), x: clamp(selected.x + 8, 0, 100) };
    setDraft((d) => ({ ...d, shapes: [...d.shapes, copy] }));
    setSelectedId(copy.id);
  };

  const removeShape = () => {
    if (!selected) return;
    const rest = draft.shapes.filter((s) => s.id !== selected.id);
    setDraft((d) => ({ ...d, shapes: rest }));
    setSelectedId(rest.at(-1)?.id ?? null);
  };

  const save = () => {
    saveIcon({ ...draft, name: draft.name.trim() || 'MI ÍCONO' });
    router.back();
  };

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    deleteIcon(draft.id);
    router.back();
  };

  // Arrastrar en el lienzo mueve la forma elegida. Tocar el lienzo reproduce la animación.
  // El gesto se crea una sola vez: si se rehiciera en cada redibujado (y al arrastrar se redibuja
  // todo el rato), se reiniciaría a mitad del arrastre. Por eso lee la forma elegida desde un ref.
  const latest = useRef({ selected, setDraft, play });
  useEffect(() => {
    latest.current = { selected, setDraft, play };
  });
  const dragStart = useRef({ id: '', x: 50, y: 50 });
  const gesture = useMemo(() => {
    const unit = INNER / 100;
    // Funciones normales (no escritas dentro de la cadena del gesto) para que corran en JS como
    // código común y puedan leer y escribir los refs.
    const onStart = () => {
      const s = latest.current.selected;
      dragStart.current = s ? { id: s.id, x: s.x, y: s.y } : { id: '', x: 50, y: 50 };
    };
    const onUpdate = (e: { translationX: number; translationY: number }) => {
      const start = dragStart.current;
      if (!start.id) return;
      const x = Math.round(clamp(start.x + e.translationX / unit, 0, 100));
      const y = Math.round(clamp(start.y + e.translationY / unit, 0, 100));
      latest.current.setDraft((d) => ({
        ...d,
        shapes: d.shapes.map((sh) => (sh.id === start.id ? { ...sh, x, y } : sh)),
      }));
    };
    const onTap = () => latest.current.play();
    const pan = Gesture.Pan().runOnJS(true).minDistance(4).onStart(onStart).onUpdate(onUpdate);
    const tap = Gesture.Tap().runOnJS(true).onEnd(onTap);
    return Gesture.Exclusive(pan, tap);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GestureDetector gesture={gesture}>
          <View style={styles.canvas} accessibilityLabel="Lienzo del ícono">
            <CustomIconView icon={draft} trigger={trigger} size={INNER} selectedId={selectedId} />
          </View>
        </GestureDetector>
        <Text style={[styles.hint, styles.centerText]}>
          ARRASTRA PARA MOVER LA FORMA · TOCA PARA PROBAR
        </Text>

        <Label>NOMBRE</Label>
        <TextInput
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="MI ÍCONO"
          placeholderTextColor={C.textSecondary}
          style={styles.nameInput}
        />

        <Label>FORMAS</Label>
        <View style={styles.wrap}>
          {draft.shapes.map((s, i) => (
            <Chip
              key={s.id}
              label={`${KIND_GLYPH[s.kind]} ${i + 1}`}
              active={s.id === selectedId}
              onPress={() => setSelectedId(s.id)}
            />
          ))}
        </View>
        {draft.shapes.length < MAX_SHAPES && (
          <View style={styles.wrap}>
            {KIND_OPTIONS.map((k) => (
              <Chip key={k.value} label={`+ ${k.label}`} onPress={() => addShape(k.value)} />
            ))}
          </View>
        )}

        {selected ? (
          <View style={styles.panel}>
            <Label>FORMA</Label>
            <Options
              options={KIND_OPTIONS}
              value={selected.kind}
              onChange={(kind) => updateShape({ kind })}
            />

            <View style={styles.steppers}>
              <Stepper
                label="TAMAÑO"
                value={selected.size}
                onChange={(size) => updateShape({ size: clamp(size, 5, 100) })}
                step={5}
              />
              <Stepper
                label="GIRO"
                value={selected.rotation}
                suffix="°"
                onChange={(rotation) => updateShape({ rotation: (rotation + 360) % 360 })}
                step={15}
              />
            </View>

            <Label>ESTILO</Label>
            <View style={styles.wrap}>
              <Chip
                label="LÍNEA"
                active={!selected.filled}
                onPress={() => updateShape({ filled: false })}
              />
              <Chip
                label="RELLENO"
                active={selected.filled}
                onPress={() => updateShape({ filled: true })}
              />
              <Chip
                label="BLANCO"
                active={selected.color === 'white'}
                onPress={() => updateShape({ color: 'white' })}
              />
              <Chip
                label="● ROJO"
                active={selected.color === 'red'}
                onPress={() => updateShape({ color: 'red' })}
              />
            </View>

            <Label>MOVIMIENTO</Label>
            <Options
              options={MOTION_OPTIONS}
              value={selected.motion}
              onChange={(motion) => updateShape({ motion }, true)}
            />

            <Label>VELOCIDAD</Label>
            <Options
              options={SPEED_OPTIONS}
              value={selected.speed}
              onChange={(speed) => updateShape({ speed }, true)}
            />

            <Label>RETRASO</Label>
            <Options
              options={DELAY_OPTIONS}
              value={selected.delay}
              onChange={(delay) => updateShape({ delay }, true)}
            />

            <View style={[styles.wrap, styles.shapeActions]}>
              {draft.shapes.length < MAX_SHAPES && (
                <Chip label="DUPLICAR" onPress={duplicateShape} />
              )}
              <Chip label="ELIMINAR FORMA" danger onPress={removeShape} />
            </View>
          </View>
        ) : (
          <Text style={styles.hint}>AGREGA UNA FORMA PARA EMPEZAR</Text>
        )}

        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.saveText}>GUARDAR ÍCONO</Text>
        </Pressable>
        {existing && (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Text style={[styles.hint, { color: C.accent }]}>
              {confirmDelete ? '¿SEGURO? TOCA OTRA VEZ' : 'ELIMINAR ÍCONO'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Chip({
  label,
  active,
  danger,
  onPress,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        danger && { borderColor: C.accent },
        pressed && { opacity: 0.6 },
      ]}>
      <Text
        style={[styles.chipText, active && styles.chipTextActive, danger && { color: C.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Options<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          label={o.label}
          active={o.value === value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

function Stepper({
  label,
  value,
  step,
  suffix = '',
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Label>{label}</Label>
      <View style={styles.stepperRow}>
        <Pressable hitSlop={8} onPress={() => onChange(value - step)} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>
          {value}
          {suffix}
        </Text>
        <Pressable hitSlop={8} onPress={() => onChange(value + step)} style={styles.stepButton}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  canvas: {
    alignSelf: 'center',
    width: CANVAS,
    height: CANVAS,
    borderRadius: CANVAS / 2,
    borderWidth: 1.5,
    borderColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { textAlign: 'center' },
  hint: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  label: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 1,
    marginTop: Spacing.three,
  },
  nameInput: {
    fontFamily: Type.dot,
    fontSize: 28,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: Spacing.two,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  panel: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary },
  chipTextActive: { color: C.text },
  steppers: { flexDirection: 'row', gap: Spacing.four },
  stepper: { flex: 1, gap: Spacing.two },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: { fontFamily: Type.mono, fontSize: 16, color: C.text },
  stepValue: {
    fontFamily: Type.dot,
    fontSize: 22,
    color: C.text,
    minWidth: 48,
    textAlign: 'center',
  },
  shapeActions: { marginTop: Spacing.three },
  saveButton: {
    marginTop: Spacing.five,
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  saveText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
  deleteButton: { alignSelf: 'center', padding: Spacing.three },
});
