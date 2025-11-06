import React from 'react';
import { View, Text } from 'react-native';
import AppDefault from './App.default';

class ErrorBoundary extends React.Component<{children:React.ReactNode},{err?:any}>{
  constructor(p:any){ super(p); this.state={}; }
  static getDerivedStateFromError(err:any){ return { err }; }
  componentDidCatch(err:any, info:any){ console.error('App crash:', err, info); }
  render(){
    if(this.state.err){
      const m=this.state.err?.message||String(this.state.err);
      return (
        <View style={{flex:1,backgroundColor:'#220a0a',alignItems:'center',justifyContent:'center',padding:16}}>
          <Text style={{color:'#fff',fontSize:18,marginBottom:6}}>💥 App crashed</Text>
          <Text style={{color:'#ffb3b3',textAlign:'center'}}>{m}</Text>
        </View>
      );
    }
    return <>{this.props.children}</>;
  }
}

export default function Root(){
  return (
    <ErrorBoundary>
      <AppDefault />
    </ErrorBoundary>
  );
}
