import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#14B8A6',
  '#F97316',
  '#EC4899',
  '#A855F7',
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
];

const PIECE_COUNT = 28;

interface Piece {
  startX: number;
  endX: number;
  rotation: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  isRound: boolean;
}

// Celebratory confetti burst — rains from the top of the screen once, then
// calls onComplete. Mount conditionally: {celebrate && <Confetti onComplete=.../>}
export default function Confetti({ onComplete }: { onComplete?: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        startX: Math.random() * SCREEN_W,
        endX: Math.random() * SCREEN_W,
        rotation: (Math.random() - 0.5) * 720,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 350,
        duration: 1600 + Math.random() * 900,
        isRound: Math.random() > 0.5,
      })),
    []
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2600,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => onComplete?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim, piece]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -20,
        left: 0,
        width: piece.size,
        height: piece.size * (piece.isRound ? 1 : 1.8),
        borderRadius: piece.isRound ? piece.size / 2 : 2,
        backgroundColor: piece.color,
        opacity: anim.interpolate({
          inputRange: [0, 0.75, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [piece.startX, piece.endX],
            }),
          },
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, SCREEN_H * 0.9],
            }),
          },
          {
            rotate: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${piece.rotation}deg`],
            }),
          },
        ],
      }}
    />
  );
}
