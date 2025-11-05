import { SafeAreaView, Text } from 'react-native';
export default function App() {
  return (
    <SafeAreaView style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <Text testID="hello">Hello from minimal App</Text>
    </SafeAreaView>
  );
}
