import { ImageResponse } from 'next/og';
export const alt = 'Astrois — Personal astrology, birth charts and daily guidance';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:'72px',background:'linear-gradient(120deg, #100d21, #261638)',color:'#faf5ed'}}>
      <div style={{display:'flex',fontSize:28,color:'#d5b77b',letterSpacing:4}}>ASTROIS · ASTROAIS.APP</div>
      <div style={{display:'flex',fontSize:76,fontWeight:700,lineHeight:1.1,marginTop:36,maxWidth:970}}>Your personal astrology guide.</div>
      <div style={{display:'flex',fontSize:30,color:'#d0c4d9',marginTop:30}}>Birth charts. Meaningful conversations. Daily guidance.</div>
      <div style={{display:'flex',fontSize:22,color:'#d5b77b',marginTop:50}}>Start with two minutes of free chat</div>
    </div>, size);
}
