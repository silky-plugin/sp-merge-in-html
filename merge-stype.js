module.exports = ($)=>{
  let cssContent = [];
  $('style').each(function() {
    let type = $(this).attr('type');
    if(type && type !== 'text/css'){return}
    cssContent.push($(this).text())
    $(this).remove()
  });
  $('head').append(`<style>${cssContent.join('\n')}</style>`)
}