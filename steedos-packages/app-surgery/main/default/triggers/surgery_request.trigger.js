const objectql = require('@steedos/objectql');

module.exports = {
    listenTo: 'surgery_request__c',

    beforeInsert: async function(){
        this.doc.state__c = '草稿'
    },

    beforeUpdate: async function(){
    
    },

    beforeDelete: async function(){
    
    },

    afterInsert: async function(){
    
    },

    afterUpdate: async function(){
    
    },

    afterDelete: async function(){
    
    },

}