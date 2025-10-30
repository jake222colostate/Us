export const Platform = { OS: 'web', select: (o: any) => (o?.web ?? o?.default ?? o) };
export const StyleSheet = { create: (o: any) => o, hairlineWidth: 1 };
export const View: any = () => null;
export const Text: any = () => null;
export const Image: any = () => null;
export const Pressable: any = () => null;
export const ScrollView: any = () => null;
export const TouchableOpacity: any = () => null;
export default {};
