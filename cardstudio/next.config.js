module.exports={webpack:(c,{isServer})=>{c.resolve.alias.canvas=false;c.resolve.alias.encoding=false;if(isServer)c.resolve.alias.paper=false;return c}}
