"use strict";
const e = require('express');
const express = require('express');
const router = express.Router();

// import Course schema
const Course = require('../models/Course');

router.use(express.json());

// get all courses
router.get('/', async (req, res) => {
    console.log('got request');
    try {
        const courseList = await Course.find({}, "-_id subject className").limit(10);

        res.json(courseList);
    } catch (err) {
        res.status(500).json(err);
    }
});

// get all subject codes
router.get('/subjects', async (req, res) => {
    try {
        const subjectList = await Course.find().distinct('subject');
        res.json(subjectList);
    } catch (err) {
        res.status(500).json(err);
    }
});

// get all course codes given subject code
router.get('/subjects/:courseId', async (req, res) => {
    // covert param to uppercase (sincee all codes are uppercase)
    var cleanCourseCode = req.params.courseId

    if (!isNaN(cleanCourseCode)) {
        cleanCourseCode = parseInt(cleanCourseCode);
    }
    
    try {
        const courseCodeList = await Course.find( { subject: req.params.courseId }, 'catalog_nbr -_id')
        
        // if courses were found, return, else send an error message.
        if (courseCodeList.length > 0) {
            res.json(courseCodeList);
        }
        else {
            res.status(404).json({error: `No courses found for subject: '${req.params.courseId}'.`});
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// get all class names
router.get('/classes', async (req, res) => {
    try {
        const classNameList = await Course.find().distinct('className');
        res.status(200).json(classNameList);
    } catch (err) {
        res.status(500).json(err);
    }
});

// get timetable data
router.get('/timetable', async (req, res) => {
    var cleanCourseCode = req.query.catalog_nbr;

    if (!isNaN(cleanCourseCode)) {
        cleanCourseCode = parseInt(cleanCourseCode);
    }

    try {
        // get specific timetable rows matching input
        var timeTableData = undefined;
        if (req.query.ssr_component === undefined) {
            // if the course component was NOT specified:
            timeTableData = await Course.find({
                subject: req.query.subject,
                catalog_nbr: cleanCourseCode
            }, '-_id subject catalog_nbr className course_info');
        }
        else {
            // if the course component was specified:
            timeTableData = await Course.find({
                subject: req.query.subject,
                catalog_nbr: cleanCourseCode,
                'course_info.ssr_component': req.query.ssr_component
            }, '-_id subject catalog_nbr className course_info');
        }

        // check to see if a course was found
        if (timeTableData.length > 0){
            res.json(timeTableData);
        }
        else {
            res.status(404).json({
                error: `Could not find timetable data for Subject: '${req.query.subject}' Class: '${req.query.catalog_nbr}' Component: '${req.query.ssr_component}'.`
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// add a new course (TO REMOVE LATER)
router.post('/', async (req, res) => {
    const course = new Course({
        catalog_nbr : req.body.catalog_nbr,
        subject : req.body.subject,
        className : req.body.className,
    });

    try {
        const savedPost = await course.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(505).json(err);
    }
})

async function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}

module.exports = router;