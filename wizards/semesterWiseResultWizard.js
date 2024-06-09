
const { default: axios } = require('axios');
const { Telegraf, Scenes, session, Markup } =require('telegraf');
const menu = require('../menu');


const semesterWiseResultWizard = new Scenes.WizardScene(
  'semesterWiseResultWizard',
  async (ctx) => {
    await ctx.reply('Please Enter Your Student ID');
    return ctx.wizard.next();
  },


  async(ctx)=>{
    const studentId= ctx?.message?.text;
    if(!studentId)   await ctx.reply('Please Enter Your Student ID');
    else {
        ctx.wizard.studentId= studentId;
        try {
            const response =await  axios.get('http://software.diu.edu.bd:8006/result/studentInfo?studentId='+studentId);
            ctx.wizard.state.info=  response.data;
            const semesterList = await axios.get('http://software.diu.edu.bd:8006/result/semesterList');
            ctx.wizard.state.semesters= semesterList.data.filter(s=>Number(s.semesterId)>=Number(ctx.wizard.state.info.semesterId));
            const buttons= createSemButtons( ctx.wizard.state.semesters);
            await ctx.replyWithHTML('PLease Choose Semester', { reply_markup:
                {
                    inline_keyboard: buttons
                }
            });
            ctx.wizard.next()
 
        } catch (error) {
            console.log(error);
            await ctx.replyWithHTML('Something went wrong. PLease try again later\n\nPlease choose an option from bellow', { reply_markup: menu('main') });
            return ctx.scene.leave();
            
        }
    }
  },




  async(ctx)=>{
    const message = ctx?.message?.text;
    const action = ctx?.update?.callback_query?.data;
    if(message) {
        const buttons= createSemButtons( ctx.wizard.state.semesters);
        await ctx.replyWithHTML('Please Choose Semester', { reply_markup:
            {
                inline_keyboard: buttons
            }
        });
    

    }
    else {
        if(action==='mainMenu') {
            await ctx.replyWithHTML('Please choose an option from bellow', { reply_markup: menu('main') });
            return ctx.scene.leave();


        }
        else {
            await ctx.reply('PLease wait for a while. We are calculating your result');
            const result = await axios.get(`http://software.diu.edu.bd:8006/result?semesterId=${action}&studentId=${ctx.wizard.state.info.studentId}`);
            if(result.data.length===0) {
                await ctx.reply('We did not found any data for the selected semester.')
            }
            else {
                const {studentName, studentId, programName, departmentName,facultyName, facShortName, semesterName, shift }= ctx.wizard.state.info;
                const results= result.data;
                let message=`<b>Name:</b> ${studentName}\n<b>ID:</b>${studentId}\n<b>Program:</b> ${programName}\n<b>Department:</b> ${departmentName}\n<b>Faculty:</b> ${facultyName} (${facShortName})\n<b>Enrolled Semester:</b> ${semesterName}\n<b>Shift:</b> ${shift}\n\n\nSubjectwise Result of semester ${results[0].semesterName}  ${results[0].semesterYear}:\n\n\n`

                results.forEach((r, index)=>{
                    message+=`${index+1}.\n<b>Course Name:</b>${r.courseTitle} (${r.customCourseId})\n<b>Course ID:</b> ${r.courseId}\n<b>Credit:</b> ${r.totalCredit}\n<b>Grade Point:</b> ${r.pointEquivalent}\n<b>Grade:</b> ${r.gradeLetter}\n\n`
                })
                message+=`\n\n\nSGPA: ${results[0].cgpa || '0.00'}`
                await ctx.replyWithHTML(message);
            }
            await ctx.replyWithHTML('Please choose an option from bellow', { reply_markup: menu('main') });
            return ctx.scene.leave();
        }
    }



  }


 
  
);

const createSemButtons= (semesters)=>{
    const buttons = semesters.map((item) => (
        Markup.button.callback(`${item.semesterName} ${item.semesterYear}`, item.semesterId)
      ));
      buttons.push({text:'Main Menu', callback_data:'mainMenu'});
      
      const buttonsRows = [];
      while (buttons.length) {
        buttonsRows.push(buttons.splice(0, 2));
      }
    
      return buttonsRows;

}

module.exports= semesterWiseResultWizard;