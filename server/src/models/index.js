const db = require('../services/database.service');
const { v4: uuidv4 } = require('uuid');

class Model {
  constructor(collectionName) {
    this.collection = collectionName;
  }

  // 创建新记录
  async create(data) {
    const newItem = { 
      id: data.id || uuidv4(), 
      ...data, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    db.get(this.collection).push(newItem).write();
    return newItem;
  }

  // 查找所有符合条件的记录
  async findAll(options = {}) {
    let query = db.get(this.collection);
    
    if (options.where) {
      query = query.filter(options.where);
    }
    
    if (options.order) {
      // 简单的排序支持 (仅支持第一个排序条件)
      const [field, direction] = options.order[0];
      query = query.sortBy(field);
      if (direction === 'DESC') {
        query = query.reverse();
      }
    }

    return query.value();
  }

  // 查找单个记录
  async findOne(options = {}) {
    if (!options.where) return null;
    return db.get(this.collection).find(options.where).value();
  }
  
  // 根据主键查找
  async findByPk(id) {
    return db.get(this.collection).find({ id }).value();
  }

  // 保存/更新记录 (模拟实例方法)
  async save(record) {
    if (!record.id) return this.create(record);
    
    db.get(this.collection)
      .find({ id: record.id })
      .assign(record)
      .assign({ updatedAt: new Date() })
      .write();
    return record;
  }
}

// 实例化模型
const User = new Model('users');
const Template = new Model('templates');
const DialogSession = new Model('dialogSessions');
const UserSelection = new Model('userSelections');

module.exports = {
  User,
  Template,
  DialogSession,
  UserSelection
};
