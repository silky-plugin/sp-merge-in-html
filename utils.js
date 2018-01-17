//继承
exports.extend = (son, father)=>{
  if(!father){return son}
  if(!son){return father;}
  Object.keys(father).forEach((key)=>{
    if(father[key] == null){return}
    son[key] = father[key]
  })
  return son
}

exports.findHref = (errorMsg, hrefList, data)=>{
  return function(line){
    let href = ""
    let hrefMatch = line.match(/href=['"]([^'"]+)['"]/)
    let srcMatch = line.match(/src=['"]([^'"]+)['"]/)
    if(hrefMatch){
      href = hrefMatch[1]
    }else if(srcMatch){
      href = srcMatch[1]
    }else{
      errorMsg.push(`无法合成资源 ${data.inputFileRelativePath} 中 ${line} 不包含 href 属性，请移除标签的component属性，修复问题`)
      return line
    }
    if(/^((http:\/\/)|(https:\/\/)|(\/\/))/.test(href)){
      errorMsg.push(`无法合成资源， 在${data.inputFileRelativePath}中修改${line}href或src为本地路径，即删除 '{{global.xxx}}' 用合适的本地路径代替（推荐）】或者【移除标签上的component】`)
      return line
    }
    hrefList.push(href)
    return ""
  }
}
