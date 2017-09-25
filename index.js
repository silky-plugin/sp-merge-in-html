/**
 * Desc: 合并页面的js，css引用
 */
'use strict';
const _cheerio = require('cheerio')
const _path = require('path')
const _mergeScript = require('./merge-script');
const _mergeStype = require('./merge-style');
const _fs = require("fs");
const _getOutputFilepath = require('./getOutputFilepath')
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

//获取文件数据
const getFileData = (cli, href, targetHref, buildConfig, setting, appendFilePrefix)=>{
  //加到每个文件后到，用来隔离每个文件。比如js用`;`隔开
  appendFilePrefix = appendFilePrefix ? appendFilePrefix : ""
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
}

//继承
const extend = (son, father)=>{
  if(!father){return son}
  if(!son){return father;}
  Object.keys(father).forEach((key)=>{
    if(father[key] == null){return}
    son[key] = father[key]
  })
  return son
}

//标签引用
const mergeTagImport = (cli, content, options, data, buildConfig)=>{
  let $ = _cheerio.load(content, {decodeEntities: false});
  // /path/to/xx.html =>  xx
  let htmlFileName = data.outputFilePath.split(_path.sep).pop().split('.').shift();

  // START ------------------------css组件提取
  //默认配置
  let cssSetting = extend({selector: ["link[component]"], out: "/css/$file.css", search: []}, options.css);
  //需要出入的合并后的文件链接
  let cssHref =  _getOutputFilepath(cssSetting.out, htmlFileName, data.inputFileRelativePath) //.replace('$file', htmlFileName).replace('$path', )
  let hasCssComponent = false;
  //属于css组件的选择器数组
  let cssComponentSelector = [].concat(cssSetting.selector);

  cssComponentSelector.forEach((selector)=>{
    $(selector).each(function(){
      //提取组件链接到的文件路径，放入到 buildConfig.__extra里面
      getFileData(cli, $(this).attr('href'), cssHref, buildConfig, cssSetting);
      hasCssComponent = true
      $(this).remove();
    });
  })
  //添加全局引用到哪个选择器
  if(hasCssComponent){
    let cssAppendToSelector = cssSetting.appendTo || "head";
    $(cssAppendToSelector).append(`<link type="text/css" rel="stylesheet" href="${cssHref}" />`)
  }
  // END ----------------------- css组件提取结束

  // START ------------------------js组件提取
  let jsSetting = extend({selector: ["script[component]"], out: "/js/$file.js", search:[]}, options.js);
  let hasJScomponent = false;
  let jsComponentSelector = [].concat(jsSetting.selector);
  let jsSrc =  _getOutputFilepath(jsSetting.out, htmlFileName, data.inputFileRelativePath) //jsSetting.out.replace('$file', htmlFileName);

  jsComponentSelector.forEach((selector)=>{
    $(selector).each(function(){
      getFileData(cli, $(this).attr('src'), jsSrc, buildConfig, jsSetting, ";");
      hasJScomponent = true
      $(this).remove();
    });
  });

  if(hasJScomponent){
    let jsAppendToSelector = jsSetting.appendTo || "body";
    $(jsAppendToSelector).append(`<script src="${jsSrc}"></script>`);
  }
  // END ------------------------ js组件提取结束

  //合并 <script> 里面的内容
  if(options.script){
    _mergeScript($)
  }
  //合并 <style> 里面的内容
  if(options.style){
    _mergeStype($)
  }

  return $.html()
}

const replaceTag = (content)=>{
  let $ = _cheerio.load(content, {decodeEntities: false});
  $("link[type='component/css']").each(function(){
    $(this).attr('type', 'text/css')
  });
  $("script[type='component/js']").each(function(){
    $(this).removeAttr('type')
  })
  return $.html()
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