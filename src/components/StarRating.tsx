import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  value: number; // 0-5
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 32,
  readonly = false,
}: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const Star = (
          <Text style={[styles.star, { fontSize: size }]}>
            {filled ? '★' : '☆'}
          </Text>
        );
        if (readonly) {
          return <View key={i}>{Star}</View>;
        }
        return (
          <Pressable
            key={i}
            onPress={() => onChange?.(i)}
            hitSlop={4}
            style={{ marginHorizontal: 2 }}
          >
            {Star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#FFB400',
    fontWeight: '700',
  },
});