export default {
  TUIConversation: {
    // ConversationPlaceHolder
    'Loading': '加载中...',
    'No conversations': '暂无会话',
    'Load failed': '加载失败',
    'Retry': '重试',

    // ConversationCreate
    'Start chat': '发起会话',
    'Add Participants': '添加成员',
    'Search': '搜索',
    'New group chat': '新建群聊',
    'Next': '下一步',
    'Create': '创建',

    // ConversationCreateGroupDetail
    'Group Name': '群名称',
    'Group ID': '群ID',
    'Group Type': '群类型',
    'Participants': '群成员',

    // Group types
    'Private': '工作群',
    'Work': '工作群',
    'Public': '公开群',
    'Meeting': '会议群',
    'AVChatRoom': '直播群',
    'Community': '社群',

    // Group type descriptions
    'Users can join the group only via invitation by existing members. The invitation does not need to be agreed by the invitee or approved by the group owner. See the documentation for details.': '用户只能通过现有成员的邀请加入群组。邀请无需被邀请人同意或群主批准。详情请参阅文档。',
    'After a public group is created, the group owner can designate group admins. To join the group, a user needs to search the group ID and send a request, which needs to be approved by the group owner or an admin before the user can join the group. See the documentation for details.': '公共群组创建后，群主可以指定群管理员。用户加入群组需要搜索群ID并发送请求，群主或管理员批准后方可加入。详情请参阅文档。',
    'After the group is created, a user can join and quit the group freely and can view the messages sent before joining the group. It is suitable for scenarios that integrate Tencent Real-Time Communication (TRTC), such as audio and video conferences and online education. See the documentation for details.': '群组创建后，用户可以自由加入和退出群组，并可以查看加入群组前发送的消息。适用于音视频会议、在线教育等融合腾讯实时通信 (TRTC) 的场景。详情请参阅文档。',
    'After a group is created, a user can join and quit the group freely. The group can have an unlimited number of members, but it does not store message history. It can be combined with Live Video Broadcasting (LVB) to support on-screen comment scenarios. See the documentation for details.': '群组创建后，用户可以自由加入和退出群组。群组成员数量不限，但不保存消息历史记录。可以与直播 (LVB) 结合，支持屏幕评论场景。详情请参阅文档。',
    'After creation, you can enter and leave at will, support up to 100,000 people, support historical message storage, and after users search for group ID and initiate a group application, they can join the group without administrator approval. See product documentation for details.': '创建后可随意进出，最多支持10万人，支持历史消息存储，用户搜索群ID发起建群申请后，无需管理员审批即可加入。详情请参阅产品文档。',

    // ConversationActions
    'Pin': '置顶',
    'Unpin': '取消置顶',
    'Mute': '消息免打扰',
    'Unmute': '取消免打扰',
    'MarkRead': '标为已读',
    'MarkUnRead': '标为未读',
    'Delete': '删除',

    // Details link
    'Details': '详情',
  },
};
