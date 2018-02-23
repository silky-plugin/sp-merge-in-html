/**
 * Desc: 合并页面的js，css引用
 */
'use strict';
const _path = require('path')
const _mergeScript = require('./merge-script');
const _mergeStype = require('./merge-style');
const _fs = require("fs");
const _getOutputFilepath = require('./getOutputFilepath')
const _previewMergeTag = require('./previewMergeTag')
const _utils = require('./utils')
//寻找真实路径
const getRealFilePath = (cli, href, setting)=>{
  let extname = _path.extname(href)
  let search = setting.search;

  let filePath = _path.join(cli.cwd(), href);
  if(_fs.existsSync(filePath)){
    return filePath
  }
  //如果原文件不存在，则搜索匹配项
  filePath = false;
  for(let i = 0, length = search.length; i < length; i++){
    let tmpFilepath = _path.join(cli.cwd(), href.replace(/(\.\w+)$/, `.${search[i]}`))
    if(_fs.existsSync(tmpFilepath)){
      filePath = tmpFilepath;
      break
    }
  }
  return filePath
}

//设置待编译文件数据
const pushComponentToCompileFileQueue = (cli, href, targetHref, buildConfig, setting, appendFilePrefix)=>{
  //加到每个文件后到，用来隔离每个文件。比如js用`;`隔开
  appendFilePrefix = appendFilePrefix ? appendFilePrefix : "";
  let hrefList = [].concat(href)
  hrefList.forEach((href)=>{
    if(!href || /^(\s)*$/.test(href)){
      return;
    }
    let realFilePath = getRealFilePath(cli, href, setting);
    if(!realFilePath){
      throw Error(`找不到 合并项文件${href}`)
    }
    buildConfig.__del.push(_path.join(buildConfig.outdir,  href))
    buildConfig.__extra.push({
      inputFilePath: realFilePath,
      outputFilePath: _path.join(buildConfig.outdir,  targetHref),
      outdir: buildConfig.outdir,
      outRelativeDir: buildConfig.outRelativeDir,
      inputFileRelativePath:  href,
      outputFileRelativePath: _path.join(buildConfig.outRelativeDir, targetHref),
      fileName: href.split('/').pop(),
      appendFile: true,
      appendFilePrefix: appendFilePrefix,
      ignore: false
    })
  })
}


//标签引用
const mergeTagImport = (cli, content, options, data, buildConfig)=>{
  let htmlFileName = _path.parse(data.outputFilePath).name
  // START ------------------------css组件提取
  //默认配置
  let cssSetting = _utils.extend({selector: ["link[component]"], out: "/css/$file.css", search: []}, options.css);
  //需要输出的合并后的文件链接
  let cssHref =  _getOutputFilepath(cssSetting.out, htmlFileName, data.inputFileRelativePath)

  //固定link component  和  link[type='component/css']
  let errorMsg = [];
  let cssHrefList = [];
  let find = _utils.findHref(errorMsg, cssHrefList, data)
  content = content.replace(/<link((\s+)|[^>]+\s)component(\s?|(\s+[^>]+?))\/?>/g, find)
    .replace(/<link((\s+)|[^>]+\s)component=""(\s?|(\s+[^>]+?))\/?>/g, find)
    .replace(/<link((\s+)|[^>]+\s)type=['"]component\/css['"](\s?|(\s+[^>]+?))\/?>/g,find)
  if(errorMsg.length){
    throw new Error(errorMsg)
  }
  if(cssHrefList.length){
    pushComponentToCompileFileQueue(cli, cssHrefList, cssHref, buildConfig, cssSetting);
    if(cssSetting.appendTo=="body"){
      content = content.replace(/<body>([\s\S]+)<\/body>/, `<body>$1<link type="text/css" rel="stylesheet" href="${cssHref.replace(/\\/g, "/")}" /></body>`)
    }else{
      content = content.replace(/<head>([\s\S]+)<\/head>/, `<head>$1<link type="text/css" rel="stylesheet" href="${cssHref.replace(/\\/g, "/")}"/></head>`)
    }
  }
  // END ----------------------- css组件提取结束
  // START ------------------------js组件提取
  let jsSetting = _utils.extend({selector: ["script[component]"], out: "/js/$file.js", search:[]}, options.js);
  let jsSrc =  _getOutputFilepath(jsSetting.out, htmlFileName, data.inputFileRelativePath)
  let jsSrcList = [];
  let findSrc = _utils.findHref(errorMsg, jsSrcList, data)
  content = content.replace(/<script((\s+)|[^>]+\s)component(\s?|(\s+[^>]+?))>\s?<\/script>/g, findSrc)
    .replace(/<script((\s+)|[^>]+\s)component=""(\s?|(\s+[^>]+?))>\s?<\/script>/g, findSrc)
    .replace(/<script((\s+)|[^>]+\s)type=['"]component\/js['"](\s?|(\s+[^>]+?))>\s?<\/script>/g,findSrc)

  if(errorMsg.length){
    throw new Error(errorMsg)
  }
  if(jsSrcList.length){
    pushComponentToCompileFileQueue(cli, jsSrcList, jsSrc, buildConfig, cssSetting);
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

const replaceTag = (content)=>{
  content = content.replace(/<link[^>]*type=['"]([^>'"]+)['"][^>]*>/gi, (line, match)=>{
    if(match.indexOf("component")!=-1){
      return line.replace(match, "text/css")
    }
    return line
  })
  content = content.replace(/<script[^>]*type=['"]([^>'"]+)['"][^>]*>/gi, (line, match)=>{
    if(match.indexOf("component")!=-1){
      return line.replace(match, "text/javascript")
    }
    return line
  })
  return content
}

exports.registerPlugin = (cli, options)=>{
  cli.registerHook('route:willResponse', (req, data, responseContent, cb)=>{
    let pathname = data.realPath;
    if(!/(\.html)$/.test(pathname)){
      return cb(null,  responseContent)
    }
    //没有经过 hbs 编译, 纯html,不处理
    if(data.status != 200 || !responseContent){
      return cb(null, responseContent)
    }
    try{
      responseContent = replaceTag(responseContent, data)
      cb(null, responseContent)
    }catch(e){
      cb(e)
    }
  }, 1)

  cli.registerHook('preview:processCompile', (req, data, responseContent, cb)=>{
    if(!/(\.html)$/.test(data.realPath) || !responseContent || data.status!= 200){
      return cb(null, responseContent)
    }
    try{
      responseContent = _previewMergeTag(responseContent, options, data.realPath)
      cb(null, responseContent) 
    }catch(e){
      cb(e)
    }
  })

  cli.registerHook('build:didCompile', (buildConfig, data, content, cb)=>{
    if(!/(\.html)$/.test(data.outputFilePath) || !content){
      return cb(null, content)
    }
    let err = null
    try{
      content = mergeTagImport(cli, content, options, data, buildConfig)
    }catch(e){
      err = e
    }
    cb(err, content)
  }, 1)
}