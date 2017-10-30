module.exports = (content)=>{
  let cssContent = [];
  content = content.replace(/<style[^>]*>([\s\S]+?)<\/style>/gi,(line, match)=>{
    //只编译type存在并且type类型为css的 和 纯style的
    let typeMatch = line.match(/<style[^\>]+type\=['"]([^>'"]+)['"]>/)
    if((typeMatch && typeMatch[1] == "text/css") ||line.match(/<style>/)){
      cssContent.push(match)
      return ""
    }
    return line
  })
  return content.replace(/<head>([\s\S]+?)<\/head>/, `<head>$1<style type="text/css" rel="stylesheet">${cssContent.join('\n')}</style></head>`)
}