const _getOutputFilepath = require('./getOutputFilepath')
const _mergeScript = require('./merge-script');
const _mergeStype = require('./merge-style');
const _path = require("path")
const _utils = require('./utils')
module.exports = (content, options, pathname)=>{
  let htmlFileName = _path.parse(pathname).name

  if(content.indexOf("<!--NEEDCSSGLOBAL-->")!=-1){
    // START ------------------------css组件提取
    //默认配置
    let cssSetting = _utils.extend({out: "/css/$file.css"}, options.css);
    //需要输出的合并后的文件链接
    let cssHref =  _getOutputFilepath(cssSetting.out, htmlFileName, pathname)
    //TODO 是否需要添加全局
    if(cssSetting.appendTo=="body"){
      content = content.replace(/<body>([\s\S]+)<\/body>/, `<body>$1<link type="text/css" rel="stylesheet" href="${cssHref.replace(/\\/g, "/")}" /></body>`)
    }else{
      content = content.replace(/<head>([\s\S]+)<\/head>/, `<head>$1<link type="text/css" rel="stylesheet" href="${cssHref.replace(/\\/g, "/")}"/></head>`)
    }
    // END ----------------------- css组件提取结束
  }
  if(content.indexOf("<!--NEEDJSGLOBAL-->")!=-1){
    // START ------------------------js组件提取
    let jsSetting = _utils.extend({out: "/js/$file.js"}, options.js);
    let jsSrc =  _getOutputFilepath(jsSetting.out, htmlFileName, pathname)
    //TODO 是否需要添加全局
    if(jsSetting.appendTo=="body"){
      content = content.replace(/<body>([\s\S]+?)<\/body>/, `<body>$1<script src="${jsSrc.replace(/\\/g, "/")}"></script></body>`)
    }else{
      content = content.replace(/<head>([\s\S]+?)<\/head>/, `<head>$1<script src="${jsSrc.replace(/\\/g, "/")}"></script></head>`)
    }
  }
  // END ------------------------ js组件提取结束
  //合并 <script> 里面的内容
  if(options.script){
    content = _mergeScript(content)
  }
  //合并 <style> 里面的内容
  if(options.style){
    content = _mergeStype(content)
  }

  return content
}