
const { default: axios } = require('axios');
const { Telegraf, Scenes, session, Markup } =require('telegraf');
const menu = require('../menu');


const semesterWiseResultWizard = new Scenes.WizardScene(
  'allSemmResWizard',
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
            await ctx.reply('Please wait for a while. We are calculating your result')
            const response =await  axios.get('http://software.diu.edu.bd:8006/result/studentInfo?studentId='+studentId);
            ctx.wizard.state.info=  response.data;
            const semesterList = await axios.get('http://software.diu.edu.bd:8006/result/semesterList');
            ctx.wizard.state.semesters= semesterList.data.filter(s=>Number(s.semesterId)>=Number(ctx.wizard.state.info.semesterId));
            let res=[];
            await Promise.all(ctx.wizard.state.semesters.map(async s=>{
                try {
                    const response = await axios.get(`https://diu-cgpa-proxy-44yg.vercel.app/result?semesterId=${s.semesterId}&studentId=${studentId}`);
                   if(response.data.length>0) res=[...res,  {
                    semester: s.semesterName+ ' '+ s.semesterYear,
                    results: response.data
                   }]
                    return s;
                    
                   } catch (error) {
                    console.log(error);
                    return s;
                   }

            }));
            const {studentName, programName, departmentName,facultyName, facShortName, semesterName, shift }= ctx.wizard.state.info;
           let message=`<b>Name:</b> ${studentName}\n<b>ID:</b>${studentId}\n<b>Program:</b> ${programName}\n<b>Department:</b> ${departmentName}\n<b>Faculty:</b> ${facultyName} (${facShortName})\n<b>Enrolled Semester:</b> ${semesterName}\n<b>Shift:</b> ${shift}`
           await ctx.replyWithHTML(message);
           message='';
           let totalWeightedGPA = 0;
           let totalCredits = 0;
           for(let i=0;i<res.length;i++){
            const result= res[i];
            let tempTotalWeightedGPA = 0;
            let tempTotalCredits = 0;
            message+=result.semester+'\n\n'
            for(let j=0;j<result.results.length;j++){
                const r= result.results[j];
           
                totalWeightedGPA += r.pointEquivalent * r.totalCredit;
                tempTotalWeightedGPA  += r.pointEquivalent * r.totalCredit
                totalCredits += r.totalCredit;
                tempTotalCredits += r.totalCredit;
                message+=`${j+1}.\n<b>Course Name:</b>${r.courseTitle} (${r.customCourseId})\n<b>Course ID:</b> ${r.courseId}\n<b>Credit:</b> ${r.totalCredit}\n<b>Grade Point:</b> ${r.pointEquivalent}\n<b>Grade:</b> ${r.gradeLetter}\n\n`
            }
            const sgpa= totalCredits===0? '0.00':((tempTotalWeightedGPA / tempTotalCredits).toFixed(2)|| '0.00') ;

            await ctx.replyWithHTML(`${message}\n\nTotal SGPA: ${sgpa}`);
            message='';

           }

           const cgpa= totalCredits===0? '0.00':((totalWeightedGPA / totalCredits).toFixed(2)|| '0.00') ;


            
             await ctx.replyWithHTML('Total CGPA: '+cgpa, { reply_markup: menu('main') });
            return ctx.scene.leave();
     
             


           
 
        } catch (error) {
            console.log(error);
            await ctx.replyWithHTML('Something went wrong. PLease try again later\n\nPlease choose an option from bellow', { reply_markup: menu('main') });
            return ctx.scene.leave();
            
        }
    }
  },





 
  
);



module.exports= semesterWiseResultWizard;