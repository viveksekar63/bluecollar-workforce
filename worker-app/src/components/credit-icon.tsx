import { StyleSheet, View } from 'react-native';
import { BrandColors } from '@/constants/theme';

type CreditIconProps = {
  variant?: 'wallet' | 'starter' | 'growth' | 'business';
  size?: number;
  color?: string;
};

export default function CreditIcon({ variant = 'wallet', size = 22, color = BrandColors.indigo }: CreditIconProps) {
  const stroke = Math.max(1.5, size * 0.09);
  const shell = size * 0.82;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {variant === 'wallet' && (
        <View style={[styles.wallet, { width: shell, height: shell * 0.68, borderColor: color, borderWidth: stroke, borderRadius: size * 0.12 }]}>
          <View style={[styles.walletLine, { backgroundColor: color, height: stroke, width: shell * 0.55 }]} />
          <View style={[styles.walletTab, { width: shell * 0.28, height: shell * 0.2, borderColor: color, borderWidth: stroke, borderRadius: size * 0.05 }]} />
        </View>
      )}
      {variant === 'starter' && <View style={[styles.star, { width: shell * 0.64, height: shell * 0.64, borderColor: color, borderWidth: stroke, transform: [{ rotate: '45deg' }] }]} />}
      {variant === 'growth' && (
        <View style={[styles.growth, { width: shell * 0.72, height: shell * 0.72 }]}>
          <View style={[styles.growthBase, { backgroundColor: color, height: stroke, width: shell * 0.7 }]} />
          <View style={[styles.growthStem, { backgroundColor: color, width: stroke, height: shell * 0.45 }]} />
          <View style={[styles.growthTrend, { backgroundColor: color, width: shell * 0.38, height: stroke, transform: [{ rotate: '-38deg' }] }]} />
          <View style={[styles.growthArrow, { borderTopColor: color, borderRightColor: color, borderTopWidth: stroke, borderRightWidth: stroke, width: shell * 0.18, height: shell * 0.18 }]} />
        </View>
      )}
      {variant === 'business' && (
        <View style={[styles.building, { width: shell * 0.66, height: shell * 0.7, borderColor: color, borderWidth: stroke, borderTopLeftRadius: size * 0.04, borderTopRightRadius: size * 0.04 }]}>
          <View style={[styles.buildingWindow, { backgroundColor: color }]} />
          <View style={[styles.buildingWindow, { backgroundColor: color }]} />
          <View style={[styles.buildingWindow, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  wallet: { alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 2, position: 'relative' },
  walletLine: { borderRadius: 2, marginLeft: 3, marginTop: 2 },
  walletTab: { position: 'absolute', right: -2, top: '38%' },
  star: { borderRadius: 3 },
  growth: { alignItems: 'flex-start', justifyContent: 'flex-end', position: 'relative' },
  growthBase: { position: 'absolute', left: '3%', bottom: '8%', borderRadius: 2 },
  growthStem: { position: 'absolute', left: '43%', bottom: '8%', borderRadius: 2 },
  growthTrend: { position: 'absolute', left: '34%', bottom: '38%', borderRadius: 2 },
  growthArrow: { position: 'absolute', right: '2%', top: '7%' },
  building: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingTop: 4 },
  buildingWindow: { width: 3, height: 5, borderRadius: 1 },
});
