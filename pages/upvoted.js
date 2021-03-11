import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import CommentsList from "../components/commentsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getUserUpvotedItemsByPage from "../api/items/getUserUpvotedItemsByPage.js"
import getUserUpvotedCommentsByPage from "../api/comments/getUserUpvotedCommentsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const userId = query.id ? query.id : ""
    const page = query.page ? parseInt(query.page) : 1

    const showItems = query.comments === "t" ? false : true

    let itemsApiResult, commentsApiResult, authUserData

    if (showItems) {
      itemsApiResult = await getUserUpvotedItemsByPage(userId, page, req)

      authUserData = itemsApiResult.authUser ? itemsApiResult.authUser : {}

      commentsApiResult = {}
    } else {
      commentsApiResult = await getUserUpvotedCommentsByPage(userId, page, req)

      authUserData = commentsApiResult.authUser ? commentsApiResult.authUser : {}

      itemsApiResult = {}
    }

    const goToString = page > 1 ?
      `upvoted?id=${userId}${showItems ? "" : "&comments=t"}&page=${page}` :
      `upvoted?id=${userId}${showItems ? "" : "&comments=t"}`

    return {
      items: itemsApiResult && itemsApiResult.items,
      showItems: showItems,
      isMoreItems: itemsApiResult && itemsApiResult.isMore,
      comments: commentsApiResult && commentsApiResult.comments,
      showComments: !showItems,
      isMoreComments: commentsApiResult && commentsApiResult.isMore,
      authUserData: authUserData,
      userId: userId,
      page: page,
      getDataError: itemsApiResult.getDataError || commentsApiResult.getDataError,
      notAllowedError: itemsApiResult.notAllowedError || commentsApiResult.notAllowedError,
      goToString: goToString
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={`Upvoted ${this.props.showItems ? "Items" : "Comments"} | Hacker News`}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          label="upvoted"
        />
        <div className="items-list-content-container">
          {
            !this.props.getDataError && !this.props.notAllowedError ?
            <>
              {
                this.props.showItems ?
                <ItemsList
                  items={this.props.items}
                  goToString={this.props.goToString}
                  userSignedIn={this.props.authUserData.userSignedIn}
                  currUsername={this.props.authUserData.username}
                  showRank={true}
                  isMoreLink={`/upvoted?id=${this.props.userId}&page=${this.props.page + 1}`}
                  isMore={this.props.isMoreItems}
                  isModerator={this.props.authUserData.isModerator}
                /> : null
              }
              {
                this.props.showComments ?
                <CommentsList
                  comments={this.props.comments}
                  userSignedIn={this.props.authUserData.userSignedIn}
                  currUsername={this.props.authUserData.username}
                  showDownvote={this.props.authUserData.showDownvote}
                  isMoreLink={`/upvoted?id=${this.props.userId}&page=${this.props.page + 1}&comments=t`}
                  isMore={this.props.isMoreComments}
                  isModerator={this.props.authUserData.isModerator}
                /> : null
              }
            </> :
            <div className="items-list-error-msg">
              {
                this.props.notAllowedError ?
                <span>Can’t display that.</span> :
                <span>An error occurred.</span>
              }
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
