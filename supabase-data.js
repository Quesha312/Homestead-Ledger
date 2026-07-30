// ============================================================
// Homestead Ledger — Supabase data layer
// Requires config.js (SUPABASE_URL / SUPABASE_ANON_KEY) loaded first,
// and the Supabase JS UMD bundle loaded before this file.
// ============================================================

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB = {

  // ---------- AUTH ----------
  async signInEmail(email){
    const { error } = await sb.auth.signInWithOtp({ email, options:{ shouldCreateUser:true } });
    if(error) throw error;
  },
  async verifyOtp(email, token){
    const { data, error } = await sb.auth.verifyOtp({ email, token, type:'email' });
    if(error) throw error;
    return data.session;
  },
  async getSession(){
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  async signOut(){
    await sb.auth.signOut();
  },

  // ---------- FARMS ----------
  async ensureDefaultFarm(){
    const { data: farms, error } = await sb.from('farms').select('*').order('created_at');
    if(error) throw error;
    if(farms.length===0){
      const { data: newFarm, error: insErr } = await sb.from('farms').insert({ name:'My Farm' }).select().single();
      if(insErr) throw insErr;
      return [newFarm];
    }
    return farms;
  },
  async fetchFarms(){
    const { data, error } = await sb.from('farms').select('*').order('created_at');
    if(error) throw error;
    return data;
  },
  async insertFarm({name, location}){
    const { data, error } = await sb.from('farms').insert({ name, location }).select().single();
    if(error) throw error;
    return data;
  },
  async updateFarm(id, {name, location}){
    const { error } = await sb.from('farms').update({ name, location }).eq('id', id);
    if(error) throw error;
  },
  async deleteFarm(id){
    const { error } = await sb.from('farms').delete().eq('id', id);
    if(error) throw error;
  },

  // ---------- ANIMALS (with nested logs) ----------
  async fetchAnimals(){
    const { data, error } = await sb.from('animals')
      .select('*, weight_logs(*), health_logs(*), breeding_logs(*), production_logs(*)')
      .order('created_at', { ascending:false });
    if(error) throw error;
    return data;
  },
  async insertAnimal(farmId, obj){
    const { data, error } = await sb.from('animals').insert({
      farm_id: farmId, species_key: obj.speciesKey, name: obj.name, purpose: obj.purpose,
      sex: obj.sex, dob: obj.dob, acquired: obj.acquired, notes: obj.notes, status: 'Active'
    }).select().single();
    if(error) throw error;
    return data;
  },
  async updateAnimal(id, obj){
    const { error } = await sb.from('animals').update(obj).eq('id', id);
    if(error) throw error;
  },
  async deleteAnimal(id){
    const { error } = await sb.from('animals').delete().eq('id', id);
    if(error) throw error;
  },
  async insertWeightLog(animalId, date, value){
    const { error } = await sb.from('weight_logs').insert({ animal_id:animalId, date, value });
    if(error) throw error;
  },
  async insertHealthLog(animalId, date, text){
    const { error } = await sb.from('health_logs').insert({ animal_id:animalId, date, text });
    if(error) throw error;
  },
  async insertBreedingLog(animalId, date, dueDate){
    const { error } = await sb.from('breeding_logs').insert({ animal_id:animalId, date, due_date:dueDate });
    if(error) throw error;
  },
  async insertProductionLog(animalId, date, value){
    const { error } = await sb.from('production_logs').insert({ animal_id:animalId, date, value });
    if(error) throw error;
  },

  // ---------- HIVES ----------
  async fetchHives(){
    const { data, error } = await sb.from('hives').select('*').order('created_at');
    if(error) throw error;
    return data;
  },
  async insertHive(farmId, obj){
    const { error } = await sb.from('hives').insert({
      farm_id:farmId, hive_label:obj.hiveId, queen_status:obj.queen, strength:obj.strength, notes:obj.notes
    });
    if(error) throw error;
  },
  async updateHive(id, obj){
    const { error } = await sb.from('hives').update({
      hive_label:obj.hiveId, queen_status:obj.queen, strength:obj.strength, notes:obj.notes
    }).eq('id', id);
    if(error) throw error;
  },

  // ---------- ACADEMY UNLOCK ----------
  async isUnlocked(){
    const { data, error } = await sb.rpc('is_unlocked');
    if(error) throw error;
    return data;
  },
  async insertManualUnlock(source){
    const { error } = await sb.from('unlocks').insert({ source });
    if(error) throw error;
  },
  async redeemCode(code){
    const { data, error } = await sb.rpc('redeem_code', { p_code: code });
    if(error) throw error;
    return data; // { success, message? }
  },

  // ---------- LESSON PROGRESS ----------
  async fetchProgress(){
    const { data, error } = await sb.from('lesson_progress').select('*');
    if(error) throw error;
    const grouped = {};
    data.forEach(row=>{
      grouped[row.path_key] = grouped[row.path_key] || [];
      grouped[row.path_key].push(row.lesson_index);
    });
    return grouped;
  },
  async markLessonComplete(pathKey, lessonIndex){
    const { error } = await sb.from('lesson_progress').insert({ path_key:pathKey, lesson_index:lessonIndex });
    if(error) throw error;
  },
  async unmarkLessonComplete(pathKey, lessonIndex){
    const { error } = await sb.from('lesson_progress').delete()
      .eq('path_key', pathKey).eq('lesson_index', lessonIndex);
    if(error) throw error;
  },

  // ---------- SPECIES REQUESTS ----------
  async insertSpeciesRequest(name){
    const { error } = await sb.from('species_requests').insert({ species_name:name });
    if(error) throw error;
  },

  // ---------- TASKS / DAILY SCHEDULE ----------
  async fetchTasks(){
    const { data, error } = await sb.from('tasks').select('*').eq('active', true).order('time_of_day', { ascending: true, nullsFirst:false });
    if(error) throw error;
    return data;
  },
  async insertTask(farmId, obj){
    const { error } = await sb.from('tasks').insert({
      farm_id: farmId, animal_id: obj.animalId||null, title: obj.title, category: obj.category,
      recurrence_type: obj.recurrenceType, weekly_days: obj.weeklyDays||null,
      task_date: obj.taskDate||null, time_of_day: obj.timeOfDay||null, notes: obj.notes||''
    });
    if(error) throw error;
  },
  async updateTask(id, obj){
    const { error } = await sb.from('tasks').update(obj).eq('id', id);
    if(error) throw error;
  },
  async deleteTask(id){
    const { error } = await sb.from('tasks').update({ active:false }).eq('id', id);
    if(error) throw error;
  },
  async fetchCompletions(sinceDate){
    const { data, error } = await sb.from('task_completions').select('*').gte('date', sinceDate);
    if(error) throw error;
    return data;
  },
  async completeTask(taskId, date){
    const { error } = await sb.from('task_completions').insert({ task_id:taskId, date });
    if(error) throw error;
  },
  async uncompleteTask(taskId, date){
    const { error } = await sb.from('task_completions').delete().eq('task_id', taskId).eq('date', date);
    if(error) throw error;
  },
};
