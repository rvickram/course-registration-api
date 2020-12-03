const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({
    catalog_nbr: mongoose.Schema.Types.Mixed,
    subject : String,
    className : String,
    courseInfo : [{
        class_nbr: Number,
        start_time: String,
        end_time: String,
        campus: String,
        facility_ID: String,
        days: [],
        instructors: [],
        class_section: Number,
        ssr_component: String,
        enrl_stat: String,
        descr: String
    }],
    catalog_description: String
});

module.exports = mongoose.model('Courses', CourseSchema);