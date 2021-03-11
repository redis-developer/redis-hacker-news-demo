import { Component } from "react"

import "../../styles/pages/moderation/shadow-banned-users.css"

import AlternateHeader from "../../components/alternateHeader.js"
import HeadMetadata from "../../components/headMetadata.js"
import GoogleAnalytics from "../../components/googleAnalytics.js"

import getShadowBannedUsersByPage from "../../api/moderation/getShadowBannedUsersByPage.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getShadowBannedUsersByPage(page, req)

    return {
      users: apiResult && apiResult.users,
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      notAllowedError: apiResult && apiResult.notAllowedError
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Shadow Banned Users | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Shadow Banned Users"
        />
        <div className="moderation-shadow-banned-users-content-container">
          {
            !this.props.getDataError && !this.props.notAllowedError ?
            <>
              {
                this.props.users.length ?
                <div className="moderation-shadow-banned-users-table">
                  <table>
                    <tbody>
                      <tr className="moderation-shadow-banned-users-table-header">
                        <td>Username</td>
                      </tr>
                      {
                        this.props.users.map((user, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <a href={`/user?id=${user.username}`}>{user.username}</a>
                              </td>
                            </tr>
                          )
                        })
                      }
                      {
                        this.props.isMore ?
                        <div className="moderation-shadow-banned-users-more">
                          <a href={`/moderation/shadow-banned-users?page=${this.props.page + 1}`}>
                            <span>More</span>
                          </a>
                        </div> : null
                      }
                    </tbody>
                  </table>
                </div> :
                <>
                  <span>None found.</span>
                </>
              }
            </> :
            <div className="moderation-shadow-banned-users-error-msg">
              {
                this.props.getDataError ?
                <span>An error occurred.</span> : null
              }
              {
                this.props.notAllowedError ?
                <span>You can’t see that.</span> : null
              }
            </div>
          }
        </div>
      </div>
    )
  }
}
