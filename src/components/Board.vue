<template>
  <section>
    <h1>{{ data.title }}</h1>
    <div class="text-end mb-2">
      <button v-if="!data.user.uid" class="btn btn-primary" @click="login">ログイン</button>
      <button v-if="!!data.user.uid" class="btn btn-outline-primary" @click="logout">ログアウト</button>
    </div>
    <div class="text-end">
      [ログイン名: {{ data.user.displayName != null ? data.user.displayName : '---' }}]
    </div>
    <p class="h5">{{ data.message }}</p>
    <div v-if="data.user" class="alert alert-primary">
      <div class="form-group text-start">
        <label class="text-start">メッセージをどうぞ</label>
        <div class="row justify-content-center">
          <div class="d-inline-flex col-8 col-md-10">
            <input v-model="data.msg" class="form-control"/>
          </div>
          <div class="d-inline-flex col-4 col-md-2">
            <button @click="add" class="btn btn-primary w-100" v-bind:disabled="!data.msg || !data.user.uid">投稿</button>
          </div>
        </div>
      </div>
      <hr>
      <h3 class="mt-2 text-start">今までの書き込み</h3>
      <ul class="list-group">
        <li class="list-group-item" v-for="(item,index) in data.fire_data" v-bind:key="item.docId">
          <template v-if="!data.editable[index]">
            <p v-if="!data.editable[index]" class="h5 text-start">{{ item.msg }}</p>
            <p class="small text-end">
              {{ item.user }} ({{ formattedDate(item.posted) }}) {{ item.edited }}
            </p>
            <div class="text-end" v-if="data.user.uid === item.uid">
              <button class="btn btn-primary me-2" @click="editSwitch(index)">編集</button>
              <button class="btn btn-outline-danger" @click="deleteMsg(item.docId)">削除</button>
            </div>
          </template>
          <template v-else>
            <input v-if="data.editable[index]" type="text" class="form-control" v-model="item.msg">
            <p class="small text-end">
              {{ item.user }} ({{ formattedDate(item.posted) }})
            </p>
            <div class="text-end" v-if="data.user.uid === item.uid">
              <button class="btn btn-primary me-2" @click="rePost(index,item)">確定</button>
              <button class="btn btn-outline-danger" @click="editSwitch(index)">キャンセル</button>
            </div>
          </template>

        </li>
      </ul>
    </div>
    <div v-else>
      <div class="alert alert-warning">
        ※現在、ログインされていません
      </div>
    </div>
  </section>
</template>

<script>
import dayjs from 'dayjs'
import { computed, reactive } from 'vue';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'
import { firebaseApp } from '@/firebase';
import {
  onSnapshot,
  getFirestore,
  query,
  orderBy,
  limit,
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

const provider = new GoogleAuthProvider()
const board = collection(getFirestore(firebaseApp), 'board')
const auth = getAuth(firebaseApp)

export default {
  name: "Board",
  setup() {
    const data = reactive({
      title: 'ミニ伝言板',
      message: '最新10件の投稿を表示します。',
      user: {},
      msg: '',
      num_per_page: 10, //取り出すデータ数
      fire_data: [],
      editable: [],
    })

    //ログイン処理
    const login = async () => {
      await signInWithPopup(auth, provider)
          .then(result => {
            data.user = result.user
            data.message = 'ログインしました。'
            //firestoreの変化をリアルタイムに監視
            onSnapshot(query(board, orderBy('posted', 'desc'), limit(data.num_per_page)), querySnapshot => {
              data.editable = []
              const idArray = []
              querySnapshot.forEach(dat => {
                idArray.push(dat.id)
                data.editable.push(false)
              })
              data.fire_data = querySnapshot.docs.map(queryDocumentSnapshot => queryDocumentSnapshot.data())
              for (let i = 0; i < idArray.length; i++) {
                data.fire_data[i].docId = idArray[i]
              }
            })
          })
    }
    //ログアウト処理
    const logout = () => {
      auth.signOut()
      data.user = {}
      data.fire_data = []
      data.message = 'ログアウトしました。'
    }

    //メッセージ追加
    const add = () => {
      if (auth.currentUser == null) {
        alert('ログインしないと投稿できません')
        return
      }
      const user = auth.currentUser
      const d = serverTimestamp()
      const obj = {
        msg: data.msg,
        uid: user.uid,
        user: user.displayName,
        posted: d
      }
      addDoc(board, obj).then(() => {
        data.msg = ''
        data.message = '投稿しました。'
      })
    }
    //読みやすい日付にして返す
    const formattedDate = computed(() => (val) => {
      return dayjs(val.toDate()).format('YYYY/MM/DD HH:mm:ss')
    })
    //編集モード切り替え
    const editSwitch = index => {
      data.editable[index] = !data.editable[index]
    }
    //投稿の削除
    const deleteMsg = docId => {
      deleteDoc(doc(board, docId))
    }
    //編集して再投稿
    const rePost = (index, item) => {
      updateDoc(doc(board, item.docId), {msg: item.msg, edited: '(編集済み)'})
    }
    return {
      data, login, logout, add, formattedDate, editSwitch: editSwitch, deleteMsg, rePost,
    }
  }
}
</script>

<style scoped>

</style>
