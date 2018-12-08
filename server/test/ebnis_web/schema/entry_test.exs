defmodule EbnisWeb.Schema.ExperienceEntryTest do
  use Ebnis.DataCase, async: true

  alias EbnisWeb.Schema
  alias Ebnis.Factory.Entry, as: Factory
  alias Ebnis.Factory.Experience, as: ExpFactory
  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Query.Entry, as: Query

  @moduletag :db

  describe "mutation" do
    # @tag :skip
    test "create an entry succeeds" do
      user = RegFactory.insert()
      exp = ExpFactory.insert(user_id: user.id)
      params = Factory.params(exp)

      variables = %{
        "entry" => Factory.stringify(params)
      }

      query = Query.create()

      assert {:ok,
              %{
                data: %{
                  "entry" => %{
                    "id" => _,
                    "fields" => fields
                  }
                }
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )

      field_defs_ids = Enum.map(fields, & &1["defId"]) |> Enum.sort()
      assert Enum.map(exp.field_defs, & &1.id) |> Enum.sort() == field_defs_ids
    end

    # @tag :skip
    test "create an entry fails if wrong experience id" do
      user = RegFactory.insert()

      params = %{
        exp_id: "0",
        fields: [Factory.field(def_id: Ecto.UUID.generate())]
      }

      variables = %{
        "entry" => Factory.stringify(params)
      }

      query = Query.create()
      error = Jason.encode!(%{exp_id: "does not exist"})

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an entry fails if wrong user" do
      user = RegFactory.insert()
      exp = ExpFactory.insert(user_id: user.id)
      params = Factory.params(exp)
      query = Query.create()
      error = Jason.encode!(%{exp_id: "does not exist"})
      another_user = RegFactory.insert()

      variables = %{
        "entry" => Factory.stringify(params)
      }

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(another_user)
               )
    end

    # @tag :skip
    test "create an entry fails if field def does not exist" do
      user = RegFactory.insert()
      exp = ExpFactory.insert(user_id: user.id)
      params = Factory.params(exp)
      bogus_field = Factory.field(def_id: Ecto.UUID.generate())
      params = update_in(params.fields, &[bogus_field | &1])
      query = Query.create()

      error =
        Jason.encode!(%{
          fields: [
            %{
              meta: %{
                def_id: bogus_field.def_id,
                index: 0
              },
              errors: %{def_id: "does not exist"}
            }
          ]
        })

      variables = %{
        "entry" => Factory.stringify(params)
      }

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an entry fails if field def_id not unique" do
      user = RegFactory.insert()
      exp = ExpFactory.insert(user_id: user.id)
      params = Factory.params(exp)
      fields = params.fields
      # replace only the data attribute, def_id will not be replaced
      first_field = List.first(fields) |> Factory.field()
      len = length(fields)
      params = Map.put(params, :fields, fields ++ [first_field])
      query = Query.create()

      error =
        Jason.encode!(%{
          fields: [
            %{
              meta: %{
                def_id: first_field.def_id,
                index: len
              },
              errors: %{def_id: "has already been taken"}
            }
          ]
        })

      variables = %{
        "entry" => Factory.stringify(params)
      }

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create entry fails if data type of field def does not match data of field" do
      user = RegFactory.insert()

      exp =
        %{
          user_id: user.id,
          title: Faker.String.base64(),
          field_defs: [%{name: Faker.String.base64(), type: "integer"}]
        }
        |> ExpFactory.insert()

      [fdef | _] = exp.field_defs

      params = %{
        exp_id: exp.id,
        fields: [%{def_id: fdef.id, data: %{single_line_text: "some text"}}]
      }

      variables = %{
        "entry" => Factory.stringify(params)
      }

      query = Query.create()

      error =
        Jason.encode!(%{
          fields: [
            %{
              meta: %{
                def_id: fdef.id,
                index: 0
              },
              errors: %{def_id: "invalid data type"}
            }
          ]
        })

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end
  end

  defp context(user), do: %{current_user: user}
end