module.exports = (content)=>{
  let scriptContent = [];
  content = content.replace(/<script[^>]*>([\s\S]+?)<\/script>/gi,(line, match)=>{
    //只编译type存在并且type类型为css的 和 纯style的
    let typeMatch = line.match(/<script[^\>]+type\=['"]([^>'"]+)['"]>/)
    if((typeMatch && typeMatch[1] == "text/javascript") ||line.match(/<script>/)){
      scriptContent.push(match)
      return ""
    }
    return line
  })
  return content.replace(/<body>([\s\S]+?)<\/body>/, `<body>$1<script>${scriptContent.join(';\n')}</script></body>`)
}