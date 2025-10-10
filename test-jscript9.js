/*
Example JScript9 file demonstrating the language features
@import "ecma"
@import Mails from "custom/rpva/crm/mails";
@import Documents from "custom/rpva/crm/documents";
@import consultationDossiersAC from "custom/rpva/core/consultationDossiersAC";
*/

// This file demonstrates the JScript9 language support features

var module = {
    /**
     * @description Process incoming RPVA data and create mail records
     * @param {Object} rpvaData - The data from RPVA system
     * @returns {Object} Result object with mailKey
     */
    processRPVAData: function (rpvaData) {
        if (!rpvaData || !rpvaData.hasOwnProperty('msgId')) {
            throw new Error('Invalid RPVA data provided');
        }
        
        // Hover over 'Mails' to see available methods
        // Ctrl+Click on 'Mails' to go to the mails.js file
        var mailKey = Mails.saveMailFromRPVA(rpvaData);
        
        // Ctrl+Click on 'addFilesToDocument' to jump to its definition
        var filesAdded = Documents.addFilesToDocument(rpvaData);
        
        // Using another imported module
        var consultation = consultationDossiersAC.getConsultation(rpvaData.dossierId);
        
        return {
            mailKey: mailKey,
            filesAdded: filesAdded,
            consultation: consultation
        };
    },
    
    /**
     * @description Validate incoming data
     * @param {Object} data - Data to validate
     */
    validateData: function (data) {
        // Example of ES6 features that would trigger warnings:
        // const result = true;  // Warning: use 'var' instead
        // let status = 'ok';    // Warning: use 'var' instead
        // const fn = () => {}   // Error: arrow functions not supported
        // const msg = `Hello`   // Error: template literals not supported
        
        var result = true;
        var status = 'ok';
        
        if (data && data.msgId) {
            result = true;
        }
        
        return result;
    },
    
    /**
     * @description Example of undefined module reference
     */
    exampleError: function() {
        // This will show an error because 'UndefinedModule' is not imported
        // UndefinedModule.doSomething();
        
        // This is correct - using an imported module
        return Documents.getDocumentCount();
    }
};

// Example of import statement outside comment block
// This would trigger an error:
// @import AnotherModule from "custom/another/module";

return module;