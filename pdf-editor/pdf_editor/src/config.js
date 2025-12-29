export const APP_CONFIG={
  name:'PDF Editor Ultra',
  version:'1.0.0',
  autosave:true,
  autosaveInterval:60000,
  renderQuality:'medium',
  theme:'auto',
  recentFilesLimit:10
}
export function initTheme(){
  const pref=localStorage.getItem('theme')||APP_CONFIG.theme
  if(pref==='dark'||(pref==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
    document.documentElement.classList.add('dark')
  }else{
    document.documentElement.classList.remove('dark')
  }
}
export function setTheme(mode){
  localStorage.setItem('theme',mode)
  if(mode==='dark'){document.documentElement.classList.add('dark')}
  else if(mode==='light'){document.documentElement.classList.remove('dark')}
  else{
    if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }
}